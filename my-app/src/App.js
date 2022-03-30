import React, { useState,useEffect } from "react";
import { fetchDetail,fetchBalance } from "./api";

import {
  Signer,
  DeployUtil,
  CLPublicKey,
  decodeBase16,
  RuntimeArgs,
  CLString,


} from "casper-js-sdk";


function App() {
  const [signerConnected, setSignerConnected] = useState(false);
  const [signerLocked, setSignerLocked] = useState(true);
  const [activeKey, setActiveKey] = useState("");
  const [balance, setbalance] = useState("");

  const [currentNotification, setCurrentNotification] = useState({
    text: "",
    severity: "",
  });

  const [message1, setMessage1] = useState("")
  const [message,setMessage] = useState("")
  const [deployhashnewModuleBytesDeploy, setDeployhashnewModuleBytesDeploy] = useState("");
  const [deployhashStoredContractByHash, setDeployhashStoredContractByHash] = useState("");

  const checkConnection = async () => {
    return await Signer.isConnected();
  };

  const getActiveKeyFromSigner = async () => {
    return await Signer.getActivePublicKey();
  };

  const connectToSigner = async () => {
    return Signer.sendConnectionRequest();
  };

  const createnewStoredContractByHashDeploy = async (publicKeyHex) => {
    const publicKey = CLPublicKey.fromHex(publicKeyHex);
    // contract hash
    const contractHash = decodeBase16(
      "95286e200f0b206c954e5386897092c40fb38a4fad56089b09e43a91e04185f0"
    );
    const deployParams = new DeployUtil.DeployParams(publicKey,
      "casper-test",
      1,
      1800000);

    let args = RuntimeArgs.fromMap({
      message1: new CLString(message1),

    });

    const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      contractHash,
      "hello_world",
      args
    );

    return DeployUtil.makeDeploy(
      deployParams,
      session,
      DeployUtil.standardPayment(10000000000)
    );
  };

  const createnewModuleBytesDeploy = async (publicKeyHex) => {
    const publicKey = CLPublicKey.fromHex(publicKeyHex);

    const deployParams = new DeployUtil.DeployParams(publicKey,
      "casper-test",
      1,
      1800000);
    let args = [];

    args = RuntimeArgs.fromMap({
      message: new CLString(message),
   
    });
    
    let lock_cspr_moduleBytes 
    await fetch('contract.wasm').then(response =>
      response.arrayBuffer()
    ).then(bytes =>
      lock_cspr_moduleBytes =  new Uint8Array(bytes)
    )
    
    const session = DeployUtil.ExecutableDeployItem.newModuleBytes(
      lock_cspr_moduleBytes,
      args
    );

    return DeployUtil.makeDeploy(
      deployParams,
      session,
      DeployUtil.standardPayment(10000000000)
    );
  };

  const signDeployStoredContractByHash = async () => { 
    // check inputs are ready
    if (!message1 ) { 
      console.log("please input message")
      return
    }
    let key;
    try {
      key = await Signer.getActivePublicKey();
    } catch (err) {
      console.log(err)
      return;
    }

    setActiveKey(key);
    let deploy, deployJSON;

    deploy = await createnewStoredContractByHashDeploy(key);
        deployJSON = DeployUtil.deployToJson(deploy);
    let signedDeployJSON; 
    
    try {
      signedDeployJSON = await Signer.sign(deployJSON, key, key);
    } catch (err) {
      console.log(err)
  

      return;
    }
  
    const { data } = await fetchDetail(signedDeployJSON);
    console.log("data:",data)

    setDeployhashStoredContractByHash(data);

  }

  const signnewModuleBytesDeploy = async () => { 
    // check inputs are ready
    if (!message ) { 
      console.log("please input message")
      return
    }
  
    let key;
    try {
      key = await Signer.getActivePublicKey();
    } catch (err) {
    console.log(err)
      return;
    }

    setActiveKey(key);
    let deploy, deployJSON;

    deploy = await createnewModuleBytesDeploy(key);
        deployJSON = DeployUtil.deployToJson(deploy);
    let signedDeployJSON; 
    
    try {
      signedDeployJSON = await Signer.sign(deployJSON, key, key);
    } catch (err) {
      console.log(err)
  
      return;
    }
  
    const { data } = await fetchDetail(signedDeployJSON);
    console.log("data:",data)

    setDeployhashnewModuleBytesDeploy(data);

  }

  const getbalance = async () => {
    if (!activeKey) return
    const { data } = await fetchBalance(activeKey);
    setbalance(data)
    

   }

  useEffect(() => {
    // Your code here
    setTimeout(async () => {
      try {
        const connected = await checkConnection();
        setSignerConnected(connected);
      } catch (err) {
        console.log(err);
       

      }
    }, 100);

    const tmpfunc = async () => {
      if (signerConnected) setActiveKey(await getActiveKeyFromSigner());
    };
    tmpfunc();

    window.addEventListener("signer:connected", (msg) => {
      setSignerLocked(!msg.detail.isUnlocked);
      setSignerConnected(true);
      setActiveKey(msg.detail.activeKey);
      setCurrentNotification({
        text: "Connected to Signer!",
        severity: "success",
      });
 
    });
    window.addEventListener("signer:disconnected", (msg) => {
      setSignerLocked(!msg.detail.isUnlocked);
      setSignerConnected(false);
      setActiveKey(msg.detail.activeKey);
      setCurrentNotification({
        text: "Disconnected from Signer",
        severity: "info",
      });
    
    });
    window.addEventListener("signer:tabUpdated", (msg) => {
      setSignerLocked(!msg.detail.isUnlocked);
      setSignerConnected(msg.detail.isConnected);
      setActiveKey(msg.detail.activeKey);
    });
    window.addEventListener("signer:activeKeyChanged", (msg) => {
      setActiveKey(msg.detail.activeKey);
      setCurrentNotification({
        text: "Active key changed",
        severity: "warning",
      });
 
    });
    window.addEventListener("signer:locked", (msg) => {
      setSignerLocked(!msg.detail.isUnlocked);
      setCurrentNotification({ text: "Signer has locked", severity: "info" });

      setActiveKey(msg.detail.activeKey);
    });
    window.addEventListener("signer:unlocked", (msg) => {
      setSignerLocked(!msg.detail.isUnlocked);
      setSignerConnected(msg.detail.isConnected);
      setActiveKey(msg.detail.activeKey);
    });
    window.addEventListener("signer:initialState", (msg) => {
      console.log("Initial State: ", msg.detail);
      setSignerLocked(!msg.detail.isUnlocked);
      setSignerConnected(msg.detail.isConnected);
      setActiveKey(msg.detail.activeKe);
    });
  }, []);


  return (
    <div className="App">
      <div>
        <button onClick={connectToSigner}> connect to mysigner</button>
        <div>Public key</div>
        <div> {activeKey}</div>
      </div>
      <hr />
      <div>======<strong>StoredContractByHash</strong> ======
      <div> 
        <label htmlFor="">message1 
          <input type="text" value={message1}
            onChange={ e=>setMessage1(e.target.value)}/>
          { message1}  
        </label>
          
          <br />
          
        <div><input type="submit" value="deploy" onClick={signDeployStoredContractByHash} />
          <hr />
        </div>

        { deployhashStoredContractByHash && <div>deploy hash { deployhashStoredContractByHash}</div>}

        </div>
      </div>
      <hr />
      <div>======<strong>newModuleBytesDeploy</strong> ======
      <div>
          
        <label htmlFor="">message 
          <input type="text" value={message}
            onChange={ e=>setMessage(e.target.value)}/>
          { message}  
        </label>
          
          <br />
         
        <div><input type="submit" value="deploy" onClick={signnewModuleBytesDeploy} />
          <hr />
        </div>

        { deployhashnewModuleBytesDeploy && <div>deploy hash { deployhashnewModuleBytesDeploy}</div>}

        </div>
      </div>
      <div>====<strong>get balance</strong>====
        <div><input type="submit" value="getbalance" onClick={getbalance} />
          {!activeKey && <div>please connect to signer</div>}
          {balance && <div>balance is { balance} motes</div>}
          <hr />
        </div>
      </div>
    </div>
  );
}

export default App;
