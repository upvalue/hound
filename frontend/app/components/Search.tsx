import axios from "axios";
import classNames from "classnames";
import { Highlight, themes } from "prism-react-renderer";
import React, { useState } from "react";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useQuery } from "react-query";
import { ClientOnly } from "remix-utils";
import { HOUND_URI } from "~/constants";
import { HoundConfig, HoundConfigRepo, HoundFileMatch, HoundRepoResult, HoundSearchResult } from "~/types";
import { UrlParts, UrlToRepo } from "~/utils";

import frontendConfig from '../../config.json';

const FileResults = ({
    fileResult,
    repoConfig,
    revision,
}: {
    repoConfig: HoundConfigRepo,
    fileResult: HoundFileMatch,
    revision: string,
}) => {
    const { Matches, Filename } = fileResult;
    const fileUrl = UrlToRepo(repoConfig, Filename, Matches[0].LineNumber, revision);
    return <>
        <div className="prose">
            <h4><a href={fileUrl}>{Filename}</a></h4>
        </div>
        {Matches.slice(0, 10).map(match => {
            const beginLine = match.LineNumber - match.Before.length;
            return <Highlight
                key={beginLine}
                language="go"
                theme={themes.nightOwl}
                code={`${match.Before.join('\n')}\n${match.Line}\n${match.After.join('\n')}`}
            >
                {({ className, style, tokens, getLineProps, getTokenProps }) => {
                    return (
                        <div className="grid grid-cols-[auto,1fr] ">
                            {
                                tokens.map((line, i) => {
                                    return (
                                        <React.Fragment key={i}>
                                            <div className={classNames('bg-base-300 whitespace-pre-wrap text-right select-none font-mono py-0.5 px-2', beginLine + i == match.LineNumber && 'font-bold text-white')}>{(beginLine + i + 1).toString().padStart(5, ' ')}</div>
                                            <div className="py-0.5 px-1 bg-base-200 font-mono whitespace-pre-wrap">
                                                <div key={i} {...getLineProps({ line })}>
                                                    {line.map((token, key) => (
                                                        <span key={key} {...getTokenProps({ token })} />
                                                    ))}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            }
                        </div>
                    )
                }}
            </Highlight >
        })}
    </>
}

const Repo = ({
    repoConfig,
    repoName
}: {
    repoConfig: HoundConfigRepo,
    repoName: string
}) => {
    const parts = UrlParts(repoConfig);
    const rest = parts.url.split('/').slice(-2);
    return <div className="prose flex mt-2 mb-2">
        <h3>
            <a href={parts.url}>{rest[0]} / {rest[1]}</a>
        </h3>
    </div>
}

const Results = ({
    config,
    query,
}: {
    config: HoundConfig;
    query: string,
}) => {
    const [truncate, _setTruncate] = useState(true);

    const queryParams = new URLSearchParams([
        ["stats", "fosho"],
        ["i", "nope"],
        ["literal", "nope"],
        ["excludeFiles", ""],
        ["repos", "*"],
        ["q", query],
    ]);

    if (frontendConfig.truncateResultsAfter) {
        queryParams.set("limit", frontendConfig.truncateResultsAfter.toString());
    }

    const { data: queryRes } = useQuery(
        ["repo", query],
        () => axios.get<HoundSearchResult>(`${HOUND_URI}/search?${queryParams.toString()}`),
    );

    const result = queryRes?.data

    if (!result) {
        return "no result";
    }

    const { truncateResultsAfter } = frontendConfig;

    // In order to truncate properly we collapse the repo/file results
    // into a single array
    type ResultFileRender = { type: 'file', result: HoundFileMatch, repoConfig: HoundConfigRepo, revision: string };
    type ResultRender = { type: 'repo', repoConfig: HoundConfigRepo, repoName: string } | ResultFileRender;

    const results: Array<ResultRender> = Object.keys(result.Results).flatMap((repo) => [
        {
            type: 'repo',
            repoConfig: config.repos[repo],
            repoName: repo,
        },
        ...result.Results[repo].Matches.map((match): ResultFileRender => ({
            revision: result.Results[repo].Revision,
            type: 'file',
            repoConfig: config.repos[repo],
            result: match
        }))
    ]);

    let truncatedResults = results.slice(0, truncate ? truncateResultsAfter : results.length);

    // Don't show only a repository
    if (truncatedResults.length > 0 && truncatedResults.slice(-1)[0].type === 'repo') {
        truncatedResults = truncatedResults.slice(0, -1);
    }

    return <>
        {truncatedResults.map(r => {
            if (r.type === 'repo') {
                return (
                    <Repo key={r.repoConfig.url} repoConfig={r.repoConfig} repoName={r.repoName} />
                )
            } else if (r.type === 'file') {
                return (
                    <FileResults key={r.result.Filename} revision={r.revision} repoConfig={r.repoConfig} fileResult={r.result} />
                );
            }
        })}
    </>



};

/**
 * Search component
 */
export const Search = ({ config }: { config: HoundConfig }) => {
    const [query, setQuery] = React.useState("asdf");
    const inputRef = useRef<HTMLInputElement>(null);

    console.log(frontendConfig.keys);

    useHotkeys(frontendConfig.keys.FOCUS_SEARCH, () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    });

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
            <Results query={query} config={config} />
        </div>
    );
};

