/**
 * Plugin System for ProteusJS
 * Enables extensibility and modular architecture
 */

export interface ProteusPlugin {
  name: string;
  version: string;
  dependencies?: string[];
  install: (proteus: any) => void;
  uninstall?: (proteus: any) => void;
  config?: Record<string, any>;
}

export class PluginSystem {
  private plugins: Map<string, ProteusPlugin> = new Map();
  private installedPlugins: Set<string> = new Set();
  private proteus: any;
  private initialized: boolean = false;

  constructor(proteus: any) {
    this.proteus = proteus;
  }

  /**
   * Initialize the plugin system
   */
  public init(): void {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Register a plugin
   */
  public register(plugin: ProteusPlugin): this {
    if (this.plugins.has(plugin.name)) {
      console.warn(`ProteusJS: Plugin "${plugin.name}" is already registered`);
      return this;
    }

    // Validate plugin
    if (!this.validatePlugin(plugin)) {
      throw new Error(`ProteusJS: Invalid plugin "${plugin.name}"`);
    }

    this.plugins.set(plugin.name, plugin);
    return this;
  }

  /**
   * Install a plugin
   */
  public install(pluginName: string): this {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`ProteusJS: Plugin "${pluginName}" not found`);
    }

    if (this.installedPlugins.has(pluginName)) {
      console.warn(`ProteusJS: Plugin "${pluginName}" is already installed`);
      return this;
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.installedPlugins.has(dep)) {
          throw new Error(
            `ProteusJS: Plugin "${pluginName}" requires dependency "${dep}" to be installed first`
          );
        }
      }
    }

    try {
      // Install the plugin
      plugin.install(this.proteus);
      this.installedPlugins.add(pluginName);

      // Emit plugin installed event
      this.proteus.getEventSystem().emit('pluginInstalled', {
        plugin: pluginName,
        version: plugin.version
      });

      console.log(`ProteusJS: Plugin "${pluginName}" v${plugin.version} installed`);
    } catch (error) {
      console.error(`ProteusJS: Failed to install plugin "${pluginName}":`, error);
      throw error;
    }

    return this;
  }

  /**
   * Uninstall a plugin
   */
  public uninstall(pluginName: string): this {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.warn(`ProteusJS: Plugin "${pluginName}" not found`);
      return this;
    }

    if (!this.installedPlugins.has(pluginName)) {
      console.warn(`ProteusJS: Plugin "${pluginName}" is not installed`);
      return this;
    }

    // Check if other plugins depend on this one
    const dependents = this.getDependents(pluginName);
    if (dependents.length > 0) {
      throw new Error(
        `ProteusJS: Cannot uninstall plugin "${pluginName}" because it's required by: ${dependents.join(', ')}`
      );
    }

    try {
      // Uninstall the plugin
      if (plugin.uninstall) {
        plugin.uninstall(this.proteus);
      }
      this.installedPlugins.delete(pluginName);

      // Emit plugin uninstalled event
      this.proteus.getEventSystem().emit('pluginUninstalled', {
        plugin: pluginName,
        version: plugin.version
      });

      console.log(`ProteusJS: Plugin "${pluginName}" uninstalled`);
    } catch (error) {
      console.error(`ProteusJS: Failed to uninstall plugin "${pluginName}":`, error);
      throw error;
    }

    return this;
  }

  /**
   * Check if a plugin is installed
   */
  public isInstalled(pluginName: string): boolean {
    return this.installedPlugins.has(pluginName);
  }

  /**
   * Get list of registered plugins
   */
  public getRegisteredPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get list of installed plugins
   */
  public getInstalledPlugins(): string[] {
    return Array.from(this.installedPlugins);
  }

  /**
   * Get plugin information
   */
  public getPluginInfo(pluginName: string): ProteusPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * Install multiple plugins in dependency order
   */
  public installMany(pluginNames: string[]): this {
    const sortedPlugins = this.sortByDependencies(pluginNames);
    for (const pluginName of sortedPlugins) {
      this.install(pluginName);
    }
    return this;
  }

  /**
   * Destroy the plugin system
   */
  public destroy(): void {
    // Uninstall all plugins in reverse dependency order
    const installedPlugins = Array.from(this.installedPlugins);
    const sortedPlugins = this.sortByDependencies(installedPlugins).reverse();
    
    for (const pluginName of sortedPlugins) {
      try {
        this.uninstall(pluginName);
      } catch (error) {
        console.error(`ProteusJS: Error uninstalling plugin "${pluginName}":`, error);
      }
    }

    this.plugins.clear();
    this.installedPlugins.clear();
    this.initialized = false;
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: ProteusPlugin): boolean {
    if (!plugin.name || typeof plugin.name !== 'string') {
      console.error('ProteusJS: Plugin must have a valid name');
      return false;
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      console.error('ProteusJS: Plugin must have a valid version');
      return false;
    }

    if (!plugin.install || typeof plugin.install !== 'function') {
      console.error('ProteusJS: Plugin must have an install function');
      return false;
    }

    return true;
  }

  /**
   * Get plugins that depend on the given plugin
   */
  private getDependents(pluginName: string): string[] {
    const dependents: string[] = [];
    
    for (const [name, plugin] of this.plugins) {
      if (this.installedPlugins.has(name) && plugin.dependencies?.includes(pluginName)) {
        dependents.push(name);
      }
    }
    
    return dependents;
  }

  /**
   * Sort plugins by dependency order
   */
  private sortByDependencies(pluginNames: string[]): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (pluginName: string): void => {
      if (visiting.has(pluginName)) {
        throw new Error(`ProteusJS: Circular dependency detected involving plugin "${pluginName}"`);
      }
      
      if (visited.has(pluginName)) return;

      visiting.add(pluginName);
      
      const plugin = this.plugins.get(pluginName);
      if (plugin?.dependencies) {
        for (const dep of plugin.dependencies) {
          if (pluginNames.includes(dep)) {
            visit(dep);
          }
        }
      }
      
      visiting.delete(pluginName);
      visited.add(pluginName);
      sorted.push(pluginName);
    };

    for (const pluginName of pluginNames) {
      visit(pluginName);
    }

    return sorted;
  }
}
