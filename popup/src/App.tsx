import {
    Box,
    Button,
    Flex,
    Link,
    NumberInput,
    NumberInputField,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
} from "@chakra-ui/react";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import List from "./comps/List";
import Switch from "./comps/Switch";
import { Config, Message } from "./config";
import { getCfg, sendMsg } from "./utils";

export default function App() {
  const [cfg, rsetCfg] = useState<Config>(new Config());
  const [conversationId, setConversationId] = useState("");

  useEffect(() => {
    getCfg().then(rsetCfg);

    browser.runtime.onMessage.addListener((msg, _sender) => {
      const data: Message = JSON.parse(msg);

      if (data.cfg) {
        rsetCfg(data.cfg);
      }
    });
    browser.runtime.connect();
  }, []);

  return (
    <Box>
      <Flex padding="2" flexDirection="column">
        <Flex>
          <Switch
            label="Block Seen"
            isChecked={cfg.blockSeen}
            onChange={() => {
              sendMsg({ toggleBlockSeen: !cfg.blockSeen });
            }}
          />
          <Switch
            label="Block Typing"
            isChecked={cfg.blockTyping}
            onChange={() => {
              sendMsg({ toggleBlockTyping: !cfg.blockTyping });
            }}
          />
        </Flex>
        <Switch
          label="Fake Message Notification"
          isChecked={cfg.fakeMessageNotification}
          onChange={() => {
            sendMsg({ toggleFakeMessage: !cfg.fakeMessageNotification });
          }}
        />
      </Flex>
      <Tabs
        position="relative"
        onChange={(idx) => {
          sendMsg({ toggleBlockMode: idx ? "whitelist" : "blacklist" });
        }}
        index={cfg.blockMode == "blacklist" ? 0 : 1}
      >
        <TabList>
          <Tab>blacklist</Tab>
          <Tab>whitelist</Tab>
        </TabList>
        <Box paddingX="4" paddingTop="2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMsg({
                [cfg.blockMode == "blacklist"
                  ? "addToBlacklist"
                  : "addToWhitelist"]: conversationId,
              });
              setConversationId("");
            }}
          >
            <Flex>
              <NumberInput
                value={conversationId}
                onChange={(val) => setConversationId(val)}
              >
                <NumberInputField placeholder="conversation id" flex="1" />
              </NumberInput>
              <Button type="submit" marginStart="2">
                <FontAwesomeIcon icon={faPlus} />
              </Button>
            </Flex>
          </form>
        </Box>
        <TabPanels maxHeight="80" overflowY="scroll">
          <TabPanel>
            <List
              list={cfg.blacklist}
              onDelete={(cid) => {
                sendMsg({ removeFromBlacklist: cid });
              }}
            />
          </TabPanel>
          <TabPanel>
            <List
              list={cfg.whitelist}
              onDelete={(cid) => {
                sendMsg({ removeFromWhitelist: cid });
              }}
            />
          </TabPanel>
        </TabPanels>
        <Box position="absolute" top="2" right="4">
          <Link href="https://github.com/Sherly1001/tame" target="_blank">
            <FontAwesomeIcon icon={faGithub} />
          </Link>
        </Box>
      </Tabs>
    </Box>
  );
}
