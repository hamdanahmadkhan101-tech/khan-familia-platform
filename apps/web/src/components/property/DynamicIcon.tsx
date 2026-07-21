import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string | null | undefined;
  className?: string;
}

/**
 * Renders a Lucide icon dynamically by name.
 * Note: `lucide-react` exports icons in PascalCase (e.g. 'Wifi', 'Car').
 * Our db seed uses lower-kebab-case or just lowercase (e.g. 'wifi', 'mountain', 'car').
 */
export function DynamicIcon({ name, className }: DynamicIconProps) {
  if (!name) {
    return <LucideIcons.Check className={className} />;
  }

  // Convert string like 'mountain' to 'Mountain', or 'parking-circle' to 'ParkingCircle'
  const iconPascalCase = name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // Access the icon component from Lucide
  const IconComponent = (LucideIcons as unknown as Record<string, React.ElementType>)[
    iconPascalCase
  ];

  if (!IconComponent) {
    // Fallback if icon name doesn't match anything
    return <LucideIcons.Check className={className} />;
  }

  return <IconComponent className={className} />;
}
