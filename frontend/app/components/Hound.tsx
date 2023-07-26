import { HoundConfig } from "~/types";
import { QueryClient, QueryClientProvider } from "react-query";
import { Search } from "./Search";
import { ClientOnly } from "remix-utils";

/**
 * Main container for Hound search
 */
export const Hound = ({ config }: { config: HoundConfig }) => {
    const queryClient = new QueryClient();

    return (
        <ClientOnly fallback={<div>Loading...</div>}>
            {() =>
                <QueryClientProvider client={queryClient}>
                    <Search config={config} />
                </QueryClientProvider>
            }
        </ClientOnly>
    );
};