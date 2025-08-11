#!/usr/bin/env python3
"""
Validate ProteusJS documentation configuration for ReadTheDocs
"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists and report status."""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} (missing)")
        return False

def check_directory_exists(dirpath, description):
    """Check if a directory exists and report status."""
    if os.path.exists(dirpath):
        print(f"✅ {description}: {dirpath}")
        return True
    else:
        print(f"❌ {description}: {dirpath} (missing)")
        return False

def validate_requirements():
    """Validate requirements.txt has necessary packages."""
    req_file = "requirements.txt"
    if not os.path.exists(req_file):
        print(f"❌ Requirements file missing: {req_file}")
        return False
    
    with open(req_file, 'r') as f:
        content = f.read()
    
    required_packages = ['sphinx', 'myst-parser', 'sphinx-rtd-theme']
    missing_packages = []
    
    for package in required_packages:
        if package not in content:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing required packages: {', '.join(missing_packages)}")
        return False
    else:
        print("✅ All required packages found in requirements.txt")
        return True

def validate_conf_py():
    """Validate conf.py configuration."""
    conf_file = "conf.py"
    if not os.path.exists(conf_file):
        print(f"❌ Configuration file missing: {conf_file}")
        return False
    
    with open(conf_file, 'r') as f:
        content = f.read()
    
    required_configs = [
        'myst_parser',
        'source_suffix',
        'myst_enable_extensions'
    ]
    
    missing_configs = []
    for config in required_configs:
        if config not in content:
            missing_configs.append(config)
    
    if missing_configs:
        print(f"❌ Missing configurations: {', '.join(missing_configs)}")
        return False
    else:
        print("✅ All required configurations found in conf.py")
        return True

def main():
    """Main validation function."""
    print("🔍 Validating ProteusJS Documentation Configuration")
    print("=" * 50)
    
    # Change to docs directory
    docs_dir = Path(__file__).parent
    os.chdir(docs_dir)
    
    all_good = True
    
    # Check core files
    all_good &= check_file_exists("conf.py", "Sphinx configuration")
    all_good &= check_file_exists("requirements.txt", "Requirements file")
    all_good &= check_file_exists("index.md", "Main index file")
    all_good &= check_file_exists("../README.md", "Project README")
    all_good &= check_file_exists("../.readthedocs.yaml", "ReadTheDocs config")
    
    # Check directories
    all_good &= check_directory_exists("_static", "Static files directory")
    all_good &= check_directory_exists("v2", "v2.0.0 documentation")
    all_good &= check_directory_exists("getting-started", "Getting started docs")
    all_good &= check_directory_exists("features", "Features documentation")
    all_good &= check_directory_exists("api", "API documentation")
    
    # Validate configurations
    all_good &= validate_requirements()
    all_good &= validate_conf_py()
    
    # Check for conflicting files
    if os.path.exists("index.rst"):
        print("⚠️  Warning: index.rst exists alongside index.md (may cause conflicts)")
        all_good = False
    
    print("\n" + "=" * 50)
    if all_good:
        print("🎉 All validations passed! Documentation should build successfully.")
        sys.exit(0)
    else:
        print("❌ Some validations failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
