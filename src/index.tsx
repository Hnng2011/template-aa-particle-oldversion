import React from "react";
import ReactDOM from "react-dom/client";
import { EthereumSepolia } from "@particle-network/chains";
import { AuthCoreContextProvider } from "@particle-network/auth-core-modal";
import App from "./App";

import("buffer").then(({ Buffer }) => {
  window.Buffer = Buffer;
});

const options = {
  projectId: "c1b93722-cdab-4f50-b03e-8a997efb3a2e",
  clientKey: "crQY6HUKI00FPi4uvsFY25pqxm0c390Huf9h1Vd2",
  appId: "07b9d9c5-47d1-4455-bfbf-43c621aeaf23",
  erc4337: {
    name: "SIMPLE",
    version: "1.0.0",
  },
  wallet: {
    visible: true,
    customStyle: {
      supportChains: [EthereumSepolia],
    },
  },
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthCoreContextProvider options={options}>
      <App />
    </AuthCoreContextProvider>
  </React.StrictMode>
);
