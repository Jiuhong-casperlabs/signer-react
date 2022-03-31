const express = require("express");
const cors = require("cors");
const app = express();
const axios = require("axios");

const bodyParser = require("body-parser");
app.use(cors());

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

const { CasperServiceByJsonRPC,DeployUtil,CLPublicKey } = require("casper-js-sdk");
const client = new CasperServiceByJsonRPC("http://3.136.227.9:7777/rpc");


app.post("/", async (req, res) => {
  let { signedDeployJSON } = req.body;

  let url = "http://3.136.227.9:7777/rpc"
  
  let payload = {
    id: 1,
    jsonrpc:"2.0",
    method: 'account_put_deploy',
    params: signedDeployJSON
  }
  

  let { data: { result: { deploy_hash}, } } = await axios.post(url, payload);


  console.log("deploy_hash is: ", deploy_hash)
  
    res.status(200).send(deploy_hash);
});

app.post("/balance", async (req, res) => {
  
  let { publicKey } = req.body;
  console.log("pk is ",publicKey)

  const latestBlock = await client.getLatestBlockInfo();
  const root = await client.getStateRootHash(latestBlock.block.hash);

  const balanceUref = await client.getAccountBalanceUrefByPublicKey(
      root, 
      CLPublicKey.fromHex(publicKey)
      )

  //account balance from the last block
  const balance = await client.getAccountBalance(
      latestBlock.block.header.state_root_hash,
      balanceUref
  );

    res.status(200).send(balance.toString());
});

app.listen(9000, () => console.log("running on port 9000..."));
