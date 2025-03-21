import browser from "webextension-polyfill";

import {
  Box,
  Button,
  Flex,
  Input,
  Link,
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
        <Flex marginBottom="1">
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
          label="Block Seen on Stories"
          isChecked={cfg.blockSeenStory}
          onChange={() => {
            sendMsg({ toggleBlockSeenStory: !cfg.blockSeenStory });
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
              <Input
                flex="1"
                minWidth="60"
                placeholder="conversation id"
                type="number"
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
              />
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
