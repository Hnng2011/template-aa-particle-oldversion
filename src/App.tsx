import React, { useState, useEffect } from "react";
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

// Hàm thực thi giao dịch động
export async function executeFunction(
  smartAccount,
  contractAddress,
  ABI,
  functionName,
  inputValues
) {
  const providerEth = new ethers.providers.WebSocketProvider(
    "wss://eth-sepolia.g.alchemy.com/v2/eOLovQ082DFsqRNNckle5rVXwV7PeiyO"
  );

  try {
    const iface = new ethers.utils.Interface(ABI);
    const callData = iface.encodeFunctionData(functionName, inputValues);
    const contract = new ethers.Contract(contractAddress, ABI, providerEth);

    const tx = {
      to: contract,
      data: callData,
    };

    const feeQuotesResult = await smartAccount.getFeeQuotes(tx);
    const txHash = await smartAccount.sendTransaction(
      feeQuotesResult.verifyingPaymasterGasless ||
        feeQuotesResult.verifyingPaymasterNative
    );

    return txHash;
  } catch (e) {
    const err =
      JSON.parse(
        String(e?.data?.extraMessage?.message || "{}").substring(
          String(e?.data?.extraMessage?.message || "").indexOf("{")
        )
      ) ||
      e?.message ||
      e;
    throw new Error(typeof err === "object" ? err.error.message : err);
  }
}

const App = () => {
  const [abi, setAbi] = useState("");
  const [contract, setContract] = useState("");
  const { provider, chainInfo } = useEthereum();
  const { connect } = useConnect();
  const [functions, setFunctions] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState("");
  const [functionInputs, setFunctionInputs] = useState([]);
  const [inputValues, setInputValues] = useState({});
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

  const generateCallData = () => {
    try {
      const ABI = JSON.parse(abi);
      const iface = new ethers.utils.Interface(ABI);

      const functionNames = Object.keys(iface.functions).map(
        (fn) => iface.functions[fn]
      );

      setFunctions(functionNames);
    } catch (error) {
      alert("Please enter a valid ABI JSON.");
    }
  };

  const handleFunctionSelect = (event) => {
    const functionName = event.target.value;
    setSelectedFunction(functionName);

    const selectedFunc = functions.find((fn) => fn.name === functionName);
    if (selectedFunc) {
      setFunctionInputs(selectedFunc.inputs);

      const initialValues = selectedFunc.inputs.reduce((acc, input) => {
        acc[input.name] = "";
        return acc;
      }, {});
      setInputValues(initialValues);
    }
  };

  const handleInputChange = (e, inputName) => {
    setInputValues({
      ...inputValues,
      [inputName]: e.target.value,
    });
  };

  const isExecuteDisabled = () => {
    return functionInputs.some((input) => !inputValues[input.name]);
  };

  const handleExecute = async () => {
    try {
      const txHash = await executeFunction(
        smartAccount,
        contract,
        JSON.parse(abi),
        selectedFunction,
        Object.values(inputValues)
      );
      notification.success({
        message: "Transaction Successful",
        description: (
          <div>
            Transaction Hash:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txHash}
            </a>
          </div>
        ),
      });
    } catch (error) {
      notification.error({
        message: "Transaction Failed",
        description: error.message,
      });
    }
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
          <h2 style={{ fontSize: "12px" }}>
            original {userInfo.wallets[0].chain_name} address :{" "}
            {userInfo.wallets[0].public_address}
          </h2>
          <div className="balance-section">
            <small>
              {balance} {chainInfo.nativeCurrency.name}
            </small>

            <label htmlFor="abi">ABI:</label>
            <textarea
              id="abi"
              name="abi"
              style={{ width: "100%", borderRadius: "5px", minHeight: "20px" }}
              placeholder="Enter your ABI here..."
              value={abi}
              onChange={(e) => setAbi(e.target.value)}
            ></textarea>

            <label htmlFor="contract">Contract Address:</label>
            <input
              id="contract"
              name="contract"
              style={{ width: "100%", borderRadius: "5px", minHeight: "20px" }}
              value={contract}
              placeholder="Enter your contract address here..."
              onChange={(e) => setContract(e.target.value)}
            />

            <button style={{ width: "100%" }} onClick={generateCallData}>
              Fetch ABI and Contract Functions
            </button>

            <label htmlFor="functions">Select Function:</label>
            <select
              id="functions"
              onChange={handleFunctionSelect}
              value={selectedFunction}
            >
              <option value="">Select a function</option>
              {functions.map((func, index) => (
                <option key={index} value={func.name}>
                  {func.name}
                </option>
              ))}
            </select>

            {functionInputs.map((input, index) => (
              <div key={index}>
                <label htmlFor={input.name}>{input.name}:</label>
                <input
                  type="text"
                  id={input.name}
                  placeholder={`Enter ${input.type}`}
                  value={inputValues[input.name] || ""}
                  onChange={(e) => handleInputChange(e, input.name)}
                  style={{ width: "100%", borderRadius: "5px" }}
                />
              </div>
            ))}

            <button
              style={{ width: "100%", marginTop: "10px" }}
              onClick={handleExecute}
              disabled={isExecuteDisabled()}
            >
              Execute
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
