import { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export default function Card({ className = "", children, ...props }: Props) {
  return (
    <div
      className={`
        bg-white
        border border-slate-200
        rounded-xl
        shadow-sm
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: Props) {
  return (
    <div
      className={`px-6 py-4 border-b border-slate-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className = "", children, ...props }: Props) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}