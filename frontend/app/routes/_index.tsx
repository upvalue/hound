import { json, LoaderFunction, redirect, type V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import axios from "axios";
import _ from "lodash";
import { Highlight, themes } from "prism-react-renderer";
import React from "react";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { ClientOnly } from "remix-utils";
import classNames from 'classnames';

export const meta: V2_MetaFunction = () => [{ title: "Hound Remixed" }];

const HOUND_URI = "http://localhost:6080/api/v1";

type HoundConfig = {
  repos: {
    [key: string]: {
      url: string;
    };
  };
};

type HoundSearchResult = {
  Results: {
    [key: string]: {
      Matches: Array<{
        Filename: string;
        Matches: Array<{

          Line: string;
          Before: Array<string>;
          After: Array<string>;
          LineNumber: number;
        }>;
      }>;
    };
  };
};
export const loader = async () => {
  const config = await fetch(
    `${HOUND_URI}/config`,
  ).then(r => r.json());

  return json({ config: config as HoundConfig });
};

const QueryRes = ({
  config,
  result,
}: {
  config: HoundConfig;
  result?: HoundSearchResult;
}) => {
  if (!result) {
    return "bye";
  }

  const repoNameMap: { [key: string]: string } = {};

  Object.keys(config.repos).forEach(repoName => {
    const repo = config.repos[repoName];
    repoNameMap[repoName] = repo.url.split("/").slice(-2).join("/").replace(/\.git$/, "");
  });

  return (
    <pre>
      {Object.keys(result.Results).map((repo) => {
        const res = result.Results[repo];
        return (
          <>
            <p>{repo}</p>
            {res.Matches.map(match => {
              return <>
                {match.Matches.slice(0, 10).map((match) => {
                  const beginLine = match.LineNumber - match.Before.length;
                  return <Highlight
                    language="go"
                    theme={themes.nightOwl}
                    code={`${match.Before.join('\n')}\n${match.Line}\n${match.After.join('\n')}`}
                  >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => {
                      return (
                        <pre>
                          {tokens.map((line, i) => (
                            <div key={i} {...getLineProps({ line })}>
                              <span className={classNames(beginLine + i == match.LineNumber && 'font-bold')}>{beginLine + i + 1}</span>
                              {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token })} />
                              ))}
                            </div>
                          ))}
                        </pre>
                      )
                    }}
                  </Highlight>
                })}
              </>
            })}
          </>
        );
      })}


      {/*JSON.stringify(result, null, 2)*/}
    </pre>
  );
};

const Search2 = ({ config }: { config: HoundConfig }) => {
  const [query, setQuery] = React.useState("asdf");

  const queryParams = new URLSearchParams([
    ["stats", "fosho"],
    ["i", "nope"],
    ["literal", "nope"],
    ["excludeFiles", ""],
    ["repos", "*"],
    ["q", query],
  ]);

  const { data: queryRes } = useQuery(
    ["repo", query],
    () => axios.get<HoundSearchResult>(`http://localhost:6080/api/v1/search?${queryParams.toString()}`),
  );

  return (
    <div className="flex flex-col">
      <input
        className="input"
        placeholder="heck"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
      />
      <QueryRes config={config} result={queryRes && queryRes.data && queryRes.data} />
    </div>
  );
};

const Search = ({ config }: { config: HoundConfig }) => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Search2 config={config} />
    </QueryClientProvider>
  );
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  // TODO: For simplicity's sake, currently rendering almost everything
  // client-side.

  return (
    <ClientOnly fallback={"Loading"}>
      {() => <Search config={data.config} />}
    </ClientOnly>
  );
}
