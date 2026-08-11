import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function TestWrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("bootstrap", () => {
  it("renders without crashing", () => {
    const { container } = render(<div data-testid="smoke">ok</div>, { wrapper: TestWrapper });
    expect(screen.getByTestId("smoke")).toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});
