const express = require("express");
const cors = require("cors");
const app = express();

const bodyParser = require("body-parser");
app.use(cors());

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

const { CasperServiceByJsonRPC,DeployUtil,EventStream,EventName,CLValueParsers,CLMap,CLValueBuilder } = require("casper-js-sdk");
const client = new CasperServiceByJsonRPC("http://3.136.227.9:7777/rpc");


const LOCKEventParser = (
  {
    contractHash,
    eventNames,
  },
  value
) => {
  if (value.body.DeployProcessed.execution_result.Success) {
    const { transforms } =
      value.body.DeployProcessed.execution_result.Success.effect;

        const LOCKEvents = transforms.reduce((acc, val) => {
          if (
            val.transform.hasOwnProperty("WriteCLValue") &&
            typeof val.transform.WriteCLValue.parsed === "object" &&
            val.transform.WriteCLValue.parsed !== null
          ) {
            const maybeCLValue = CLValueParsers.fromJSON(
              val.transform.WriteCLValue
            );
            const clValue = maybeCLValue.unwrap();
            if (clValue && clValue instanceof CLMap) {
              const hash = clValue.get(
                CLValueBuilder.string("lock_unlock_cspr_contract")
              );
              const event = clValue.get(CLValueBuilder.string("event_type"));
              if (
                hash &&
                // NOTE: Calling toLowerCase() because current JS-SDK doesn't support checksumed hashes and returns all lower case value
                // Remove it after updating SDK
                hash.value().slice(9) === contractHash.slice(5).toLowerCase() &&
                event &&
                eventNames.includes(event.value())
              ) {
                acc = [...acc, { name: event.value(), clValue }];
              }
            }
          }
          return acc;
        }, []);

    return { error: null, success: !!LOCKEvents.length, data: LOCKEvents };
  }

  return null;
};
// sse catch start

const LOCKEvents = {
  LockCSPR: 'lock_cspr',
  UnLockCSPR: 'unlock_cspr',
}


const contractHash = "hash-152935c4378bbb59f4f9048a281d41306571f2f5fedc61f4b19aa00c0793418d"

const es = new EventStream("http://16.162.124.124:9999/events/main");

es.subscribe(EventName.DeployProcessed, (event) => {
  const parsedEvents = LOCKEventParser({
    contractHash, 
    eventNames: [
      LOCKEvents.LockCSPR,
      LOCKEvents.UnLockCSPR

    ]
  }, event);

  if (parsedEvents && parsedEvents.success) {
    console.log("*** EVENT start***");
    console.log(JSON.stringify(parsedEvents.data));
    console.log("*** EVENT end***");
  }
    }
);

es.start();
// sse catch end

app.post("/", async (req, res) => {
  let { signedDeployJSON } = req.body;

  let signedDeploy = DeployUtil.deployFromJson(signedDeployJSON).unwrap();
  // new

  let { deploy_hash} = await client.deploy(signedDeploy);  
  console.log("deploy_hash is: ", deploy_hash)
 

    res.status(200).send(deploy_hash);
});

app.listen(9000, () => console.log("running on port 9000..."));
