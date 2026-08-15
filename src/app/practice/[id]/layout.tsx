import { FocusProvider } from "@/context/focus-context";

export default function PracticeFocusLayout({ children }: { children: React.ReactNode }) {
  return <FocusProvider>{children}</FocusProvider>;
}
