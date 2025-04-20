import theme from '@/themes';

/**
 * Gets a color value from the theme by its path
 * @param path - Path to the color (e.g., 'primary.500', 'error.default')
 * @returns The color value
 */
export function getThemeColor(path: string): string {
  const parts = path.split('.');
  let result: any = theme.colors;
  
  for (const part of parts) {
    if (result && result[part] !== undefined) {
      result = result[part];
    } else {
      console.warn(`Theme color path '${path}' not found`);
      return '';
    }
  }
  
  return result;
}

/**
 * Gets a font size value from the theme
 * @param size - The font size key (e.g., 'sm', 'lg', '2xl')
 * @returns The font size value
 */
export function getFontSize(size: string): string {
  if (theme.fontSizes[size as keyof typeof theme.fontSizes]) {
    return theme.fontSizes[size as keyof typeof theme.fontSizes];
  }
  console.warn(`Font size '${size}' not found`);
  return theme.fontSizes.base; // Default to base font size
}

/**
 * Gets a spacing value from the theme
 * @param space - The spacing key (e.g., '2', '4', '8')
 * @returns The spacing value
 */
export function getSpacing(space: string | number): string {
  const key = space.toString();
  if (theme.spacing[key as keyof typeof theme.spacing]) {
    return theme.spacing[key as keyof typeof theme.spacing];
  }
  console.warn(`Spacing '${space}' not found`);
  return theme.spacing[4]; // Default to spacing 4
}

/**
 * Gets a shadow value from the theme
 * @param shadowKey - The shadow key (e.g., 'sm', 'lg', '2xl')
 * @returns The shadow value
 */
export function getShadow(shadowKey: string): string {
  if (theme.shadows[shadowKey as keyof typeof theme.shadows]) {
    return theme.shadows[shadowKey as keyof typeof theme.shadows];
  }
  console.warn(`Shadow '${shadowKey}' not found`);
  return theme.shadows.none; // Default to no shadow
}

/**
 * Checks if the current color mode is dark
 * @returns Boolean indicating if dark mode is active
 */
export function isDarkMode(): boolean {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
}

/**
 * Toggles between light and dark mode
 * @returns The new theme mode ('light' or 'dark')
 */
export function toggleColorMode(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    const isDark = document.documentElement.classList.contains('dark');
    const newMode = isDark ? 'light' : 'dark';
    
    // Toggle the class
    document.documentElement.classList.toggle('dark');
    
    // Store the preference
    localStorage.setItem('theme', newMode);
    
    return newMode;
  }
  return 'light';
} 