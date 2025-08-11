/**
 * @sc4rfurryx/proteusjs-pwa
 * PWA and OS integration utilities
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

// Types
export interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

export interface FileSystemOptions {
  types?: FilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
  startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}

export interface DirectoryOptions {
  mode?: 'read' | 'readwrite';
  startIn?: FileSystemOptions['startIn'];
}

export interface BadgeOptions {
  count?: number;
  flag?: boolean;
}

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export interface BackgroundSyncOptions {
  tag: string;
  minInterval?: number;
}

// Feature detection
const hasFileSystemAccess = 'showOpenFilePicker' in window;
const hasDirectoryAccess = 'showDirectoryPicker' in window;
const hasBadging = 'setAppBadge' in navigator;
const hasWebShare = 'share' in navigator;
const hasBackgroundSync = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;

/**
 * File System Access API utilities
 */
export namespace FileSystem {
  /**
   * Open file picker and return selected files
   */
  export async function openFiles(options: FileSystemOptions = {}): Promise<FileSystemFileHandle[]> {
    if (!hasFileSystemAccess) {
      throw new Error('File System Access API not supported');
    }

    return (window as any).showOpenFilePicker({
      types: options.types,
      excludeAcceptAllOption: options.excludeAcceptAllOption,
      multiple: options.multiple,
      startIn: options.startIn
    });
  }

  /**
   * Save file with File System Access API
   */
  export async function saveFile(
    data: string | ArrayBuffer | Blob,
    options: { suggestedName?: string; types?: FilePickerAcceptType[] } = {}
  ): Promise<FileSystemFileHandle> {
    if (!('showSaveFilePicker' in window)) {
      throw new Error('File System Access API save not supported');
    }

    const fileHandle = await (window as any).showSaveFilePicker({
      suggestedName: options.suggestedName,
      types: options.types
    });

    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();

    return fileHandle;
  }

  /**
   * Open directory picker
   */
  export async function openDirectory(options: DirectoryOptions = {}): Promise<FileSystemDirectoryHandle> {
    if (!hasDirectoryAccess) {
      throw new Error('Directory access not supported');
    }

    return (window as any).showDirectoryPicker({
      mode: options.mode || 'read',
      startIn: options.startIn
    });
  }

  /**
   * Read file content
   */
  export async function readFile(fileHandle: FileSystemFileHandle): Promise<File> {
    return fileHandle.getFile();
  }

  /**
   * Write to file
   */
  export async function writeFile(
    fileHandle: FileSystemFileHandle,
    data: string | ArrayBuffer | Blob
  ): Promise<void> {
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  /**
   * Check if File System Access is supported
   */
  export function isSupported(): boolean {
    return hasFileSystemAccess;
  }

  /**
   * Check if directory access is supported
   */
  export function isDirectorySupported(): boolean {
    return hasDirectoryAccess;
  }
}

/**
 * Badging API utilities
 */
export namespace Badging {
  /**
   * Set app badge
   */
  export async function set(options: BadgeOptions = {}): Promise<void> {
    if (!hasBadging) {
      console.warn('Badging API not supported');
      return;
    }

    if (options.count !== undefined) {
      await (navigator as any).setAppBadge(options.count);
    } else if (options.flag) {
      await (navigator as any).setAppBadge();
    }
  }

  /**
   * Clear app badge
   */
  export async function clear(): Promise<void> {
    if (!hasBadging) {
      console.warn('Badging API not supported');
      return;
    }

    await (navigator as any).clearAppBadge();
  }

  /**
   * Check if Badging API is supported
   */
  export function isSupported(): boolean {
    return hasBadging;
  }
}

/**
 * Web Share API utilities
 */
export namespace Share {
  /**
   * Share content using Web Share API
   */
  export async function share(data: ShareData): Promise<void> {
    if (!hasWebShare) {
      throw new Error('Web Share API not supported');
    }

    if (!canShare(data)) {
      throw new Error('Data cannot be shared');
    }

    await navigator.share(data);
  }

  /**
   * Check if data can be shared
   */
  export function canShare(data: ShareData): boolean {
    if (!hasWebShare) return false;
    return (navigator as any).canShare ? (navigator as any).canShare(data) : true;
  }

  /**
   * Check if Web Share API is supported
   */
  export function isSupported(): boolean {
    return hasWebShare;
  }

  /**
   * Check if files can be shared
   */
  export function canShareFiles(): boolean {
    if (!hasWebShare) return false;
    return (navigator as any).canShare && (navigator as any).canShare({ files: [] });
  }
}

/**
 * Background Sync utilities
 */
export namespace BackgroundSync {
  /**
   * Register background sync
   */
  export async function register(options: BackgroundSyncOptions): Promise<void> {
    if (!hasBackgroundSync) {
      throw new Error('Background Sync not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(options.tag);
  }

  /**
   * Get sync tags
   */
  export async function getTags(): Promise<string[]> {
    if (!hasBackgroundSync) {
      return [];
    }

    const registration = await navigator.serviceWorker.ready;
    return (registration as any).sync.getTags();
  }

  /**
   * Check if Background Sync is supported
   */
  export function isSupported(): boolean {
    return hasBackgroundSync;
  }
}

/**
 * Periodic Background Sync utilities
 */
export namespace PeriodicBackgroundSync {
  /**
   * Register periodic background sync
   */
  export async function register(tag: string, options: { minInterval?: number } = {}): Promise<void> {
    if (!('periodicSync' in window.ServiceWorkerRegistration.prototype)) {
      throw new Error('Periodic Background Sync not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    await (registration as any).periodicSync.register(tag, {
      minInterval: options.minInterval || 24 * 60 * 60 * 1000 // 24 hours default
    });
  }

  /**
   * Unregister periodic background sync
   */
  export async function unregister(tag: string): Promise<void> {
    if (!('periodicSync' in window.ServiceWorkerRegistration.prototype)) {
      throw new Error('Periodic Background Sync not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    await (registration as any).periodicSync.unregister(tag);
  }

  /**
   * Get periodic sync tags
   */
  export async function getTags(): Promise<string[]> {
    if (!('periodicSync' in window.ServiceWorkerRegistration.prototype)) {
      return [];
    }

    const registration = await navigator.serviceWorker.ready;
    return (registration as any).periodicSync.getTags();
  }

  /**
   * Check if Periodic Background Sync is supported
   */
  export function isSupported(): boolean {
    return 'periodicSync' in window.ServiceWorkerRegistration.prototype;
  }
}

/**
 * Install prompt utilities
 */
export namespace InstallPrompt {
  let deferredPrompt: any = null;

  /**
   * Initialize install prompt handling
   */
  export function initialize(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
    });
  }

  /**
   * Show install prompt
   */
  export async function show(): Promise<{ outcome: 'accepted' | 'dismissed' }> {
    if (!deferredPrompt) {
      throw new Error('Install prompt not available');
    }

    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return result;
  }

  /**
   * Check if install prompt is available
   */
  export function isAvailable(): boolean {
    return deferredPrompt !== null;
  }

  /**
   * Check if app is installed
   */
  export function isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: minimal-ui)').matches ||
           (window.navigator as any).standalone === true;
  }
}

/**
 * Get PWA capabilities
 */
export function getPWACapabilities() {
  return {
    fileSystemAccess: hasFileSystemAccess,
    directoryAccess: hasDirectoryAccess,
    badging: hasBadging,
    webShare: hasWebShare,
    backgroundSync: hasBackgroundSync,
    periodicBackgroundSync: PeriodicBackgroundSync.isSupported(),
    installPrompt: 'beforeinstallprompt' in window,
    standalone: InstallPrompt.isInstalled()
  };
}

/**
 * Check if running in PWA mode
 */
export function isPWA(): boolean {
  return InstallPrompt.isInstalled();
}

// Initialize install prompt handling
if (typeof window !== 'undefined') {
  InstallPrompt.initialize();
}
