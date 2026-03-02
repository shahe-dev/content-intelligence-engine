import React from 'react';
import { Building2 } from 'lucide-react';

interface LogoProps {
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export function Logo({ className = "", showIcon = true, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && (
        <div className="flex h-10 w-10 items-center justify-center">
          <Building2 className="h-full w-full text-blue-500" />
        </div>
      )}
      {showText && (
        <div className="flex flex-col">
          <span className="font-headline font-bold text-lg leading-none">Content Intelligence Engine</span>
          <span className="text-xs text-muted-foreground leading-none text-right">Real Estate</span>
        </div>
      )}
    </div>
  );
}

export default Logo;