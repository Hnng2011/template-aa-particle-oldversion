import { useState, useEffect } from "react";
import {
  useEthereum,
  useConnect,
  useAuthCore,
} from "@particle-network/auth-core-modal";
import { EthereumSepolia } from "@particle-network/chains";
import {
  AAWrapProvider,
  SendTransactionMode,
  SmartAccount,
} from "@particle-network/aa";
import { ethers } from "ethers";
import { notification } from "antd";

import "./App.css";

const App = () => {
  const { provider, chainInfo } = useEthereum();
  const { connect, disconnect } = useConnect();
  const { userInfo } = useAuthCore();

  const smartAccount = new SmartAccount(provider, {
    projectId: "c1b93722-cdab-4f50-b03e-8a997efb3a2e",
    clientKey: "crQY6HUKI00FPi4uvsFY25pqxm0c390Huf9h1Vd2",
    appId: "07b9d9c5-47d1-4455-bfbf-43c621aeaf23",
    aaOptions: {
      simple: [{ chainId: EthereumSepolia.id, version: "1.0.0" }],
    },
  });

  const customProvider = new ethers.providers.Web3Provider(
    new AAWrapProvider(smartAccount, SendTransactionMode.Gasless),
    "any"
  );
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (userInfo) {
      fetchBalance();
    }
  }, [userInfo, smartAccount, customProvider]);

  const fetchBalance = async () => {
    const address = await smartAccount.getAddress();
    const balanceResponse = await customProvider.getBalance(address);
    setBalance(ethers.utils.formatEther(balanceResponse));
  };

  const handleLogin = async (authType) => {
    if (!userInfo) {
      await connect({
        socialType: authType,
        chain: EthereumSepolia,
      });
    }
  };

  const executeUserOp = async () => {
    const signer = customProvider.getSigner();
    const tx = {
      to: "0x000000000000000000000000000000000000dEaD",
      value: ethers.utils.parseEther("0.0001"),
    };
    const txResponse = await signer.sendTransaction(tx);
    const txReceipt = await txResponse.wait();
    notification.success({
      message: "Transaction Successful",
      description: (
        <div>
          Transaction Hash:{" "}
          <a
            href={`https://snowtrace.io/tx/${txReceipt.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {txReceipt.transactionHash}
          </a>
        </div>
      ),
    });
  };

  const executeBatchUserOp = async () => {
    const tx = {
      tx: [
        {
          to: "0x000000000000000000000000000000000000dEaD",
          value: ethers.utils.parseEther("0.0001"),
        },
        {
          to: "0x000000000000000000000000000000000000dEaD",
          value: ethers.utils.parseEther("0.0001"),
        },
      ],
    };
    const txResponse = await smartAccount.sendTransaction(tx);
    notification.success({
      message: "Transaction Successful",
      description: (
        <div>
          Transaction Hash:{" "}
          <a
            href={`https://snowtrace.io/tx/${txResponse}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {txResponse}
          </a>
        </div>
      ),
    });
  };

  return (
    <div className="App">
      <div className="logo-section">
        <img
          src="https://i.imgur.com/EerK7MS.png"
          alt="Logo 1"
          className="logo logo-big"
        />
      </div>
      {!userInfo ? (
        <div className="login-section">
          <button
            className="sign-button google-button"
            onClick={() => handleLogin("google")}
          >
            <img
              src="https://i.imgur.com/nIN9P4A.png"
              alt="Google"
              className="icon"
            />
            Sign in with Google
          </button>
          <button
            className="sign-button twitter-button"
            onClick={() => handleLogin("twitter")}
          >
            <img
              src="https://i.imgur.com/afIaQJC.png"
              alt="Twitter"
              className="icon"
            />
            Sign in with X
          </button>
          <button
            className="sign-button other-button"
            onClick={() => handleLogin("")}
          >
            <img
              src="https://i.imgur.com/VRftF1b.png"
              alt="Twitter"
              className="icon"
            />
          </button>
        </div>
      ) : (
        <div className="profile-card">
          <h2>{userInfo.name}</h2>
          <div className="balance-section">
            <small>
              {balance} {chainInfo.nativeCurrency.name}
            </small>
            <button className="sign-message-button" onClick={executeUserOp}>
              Execute User Operation
            </button>
            <button
              className="sign-message-button"
              onClick={executeBatchUserOp}
            >
              Execute Batch User Operation
            </button>
            <button className="disconnect-button" onClick={disconnect}>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
