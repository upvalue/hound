import axios from "axios";
import classNames from "classnames";
import { Highlight, themes } from "prism-react-renderer";
import React from "react";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useQuery } from "react-query";
import { ClientOnly } from "remix-utils";
import { HOUND_URI } from "~/constants";
import { HoundConfig, HoundConfigRepo, HoundFileMatch, HoundRepoResult, HoundSearchResult } from "~/types";
import { UrlParts } from "~/utils";

const FileResults = ({
    fileResult,
}: {
    fileResult: HoundFileMatch,
}) => {
    return <>
        <div className="prose">
            <h4>{fileResult.Filename}</h4>
        </div>
        {fileResult.Matches.slice(0, 10).map(match => {
            const beginLine = match.LineNumber - match.Before.length;
            console.log(match);
            return <Highlight
                key={beginLine}
                language="go"
                theme={themes.nightOwl}
                code={`${match.Before.join('\n')}\n${match.Line}\n${match.After.join('\n')}`}
            >
                {({ className, style, tokens, getLineProps, getTokenProps }) => {
                    return (
                        <div className="bg-base-200">
                            <pre>
                                {tokens.map((line, i) => (
                                    <div key={i} {...getLineProps({ line })}>
                                        <span className={classNames('whitespace-pre-wrap', beginLine + i == match.LineNumber && 'font-bold')}>{(beginLine + i + 1).toString().padEnd(5, ' ')}</span>
                                        {line.map((token, key) => (
                                            <span key={key} {...getTokenProps({ token })} />
                                        ))}
                                    </div>
                                ))}
                            </pre>
                        </div>
                    )
                }}
            </Highlight>
        })}
    </>
}

const RepoResults = ({
    repo,
    repoName,
    repoResults,
}: {
    repo: HoundConfigRepo,
    repoName: string,
    repoResults: Array<HoundFileMatch>,
}) => {
    return <>
        <div className="prose flex">
            <h3>{repoName}</h3>
            <a href={UrlParts(repo).url}>link</a>
        </div>
        {repoResults.map(fileResult => <FileResults key={repoName} fileResult={fileResult} />)}
    </>;
}

const Results = ({
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

    return (
        Object.keys(result.Results).map((repo) => {
            const res = result.Results[repo];
            const repoConfig = config.repos[repo];
            return (
                <>
                    <RepoResults
                        repo={repoConfig}
                        repoName={repo}
                        repoResults={result.Results[repo].Matches}
                    />

                </>
            );
        })
    );
};

/**
 * Search component
 */
export const Search = ({ config }: { config: HoundConfig }) => {
    const [query, setQuery] = React.useState("asdf");
    const inputRef = useRef<HTMLInputElement>(null);

    useHotkeys('ctrl+k', () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    });

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
        () => axios.get<HoundSearchResult>(`${HOUND_URI}/search?${queryParams.toString()}`),
    );

    return (
        <div className="flex flex-col pt-4">
            <input
                className="input mb-4 bg-base-200"
                placeholder="heck"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                }}
                ref={inputRef}
            />
            <ClientOnly fallback={<div>loading...</div>}>
                {() => <Results config={config} result={queryRes && queryRes.data && queryRes.data} />}
            </ClientOnly>
        </div>
    );
};

