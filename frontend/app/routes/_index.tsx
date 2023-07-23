import { json, LoaderFunction, redirect, type V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import axios from "axios";
import _ from "lodash";
import { Highlight, themes } from "prism-react-renderer";
import React, { useRef } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { ClientOnly } from "remix-utils";
import classNames from 'classnames';
import { useHotkeys } from "react-hotkeys-hook";
import { HoundConfig, HoundSearchResult } from "~/types";
import { Hound } from "~/components/Hound";
import { HOUND_URI } from "~/constants";

export const meta: V2_MetaFunction = () => [{ title: "Hound Remixed" }];

export const loader = async () => {
  const config = await fetch(
    `${HOUND_URI}/config`,
  ).then(r => r.json());

  return json({ config: config as HoundConfig });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  console.log({ data })

  // For simplicity's sake, currently rendering almost everything
  // client-side. Can probably be improved

  return (
    <Hound config={data.config} />
  );
}
