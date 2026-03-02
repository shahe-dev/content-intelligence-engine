import type { FC, ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export const PageHeader: FC<PageHeaderProps> = ({ title, description, children }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="grid gap-1">
        <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};
