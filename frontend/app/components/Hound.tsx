import { HoundConfig } from "~/types";
import { QueryClient, QueryClientProvider } from "react-query";
import { Search } from "./Search";

/**
 * Main container for Hound search
 */
export const Hound = ({ config }: { config: HoundConfig }) => {
    const queryClient = new QueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <Search config={config} />
        </QueryClientProvider>
    );
};