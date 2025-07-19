
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - Light Crew',
  description: 'Login or create an account for Light Crew',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="bg-background w-full min-h-screen">{children}</div>;
}
