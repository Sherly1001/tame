import {
  Box,
  Button,
  Flex,
  Link,
  NumberInput,
  NumberInputField,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faCheck, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Config, Message } from "./config";
import { getCfg, sendMsg } from "./utils";

export default function App() {
  const [cfg, rsetCfg] = useState<Config>(new Config());
  const [conversationId, setConversationId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(-1);

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
    <Box minHeight="60">
      <Flex padding="2">
        <Flex
          flex="1"
          minWidth="36"
          alignItems="center"
          justifyContent="space-between"
          paddingEnd="4"
        >
          <Text>Block Seen</Text>
          <Switch
            isChecked={cfg.blockSeen}
            onChange={() => {
              sendMsg({ toggleBlockSeen: !cfg.blockSeen });
            }}
          />
        </Flex>
        <Flex
          flex="1"
          minWidth="36"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text>Block Typing</Text>
          <Switch
            isChecked={cfg.blockTyping}
            onChange={() => {
              sendMsg({ toggleBlockTyping: !cfg.blockTyping });
            }}
          />
        </Flex>
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
            {cfg.blacklist.map((cid, idx) => (
              <Flex key={idx} marginY="2">
                <Flex
                  flex="1"
                  border="1px solid #38383d"
                  borderRadius="6"
                  alignItems="center"
                  paddingStart="2"
                >
                  <Text>{cid}</Text>
                </Flex>
                <Button
                  type="submit"
                  marginStart="2"
                  onClick={() => {
                    if (confirmDelete != idx) {
                      setConfirmDelete(idx);
                    } else {
                      sendMsg({ removeFromBlacklist: cid });
                      setConfirmDelete(-1);
                    }
                  }}
                  onBlur={() => {
                    setConfirmDelete(-1);
                  }}
                >
                  <FontAwesomeIcon
                    icon={confirmDelete == idx ? faCheck : faTrash}
                  />
                </Button>
              </Flex>
            ))}
          </TabPanel>
          <TabPanel>
            {cfg.whitelist.map((cid, idx) => (
              <Flex key={idx} marginY="2">
                <Flex
                  flex="1"
                  border="1px solid #38383d"
                  borderRadius="6"
                  alignItems="center"
                  paddingStart="2"
                >
                  <Text>{cid}</Text>
                </Flex>
                <Button
                  type="submit"
                  marginStart="2"
                  onClick={() => {
                    if (confirmDelete != idx) {
                      setConfirmDelete(idx);
                    } else {
                      sendMsg({ removeFromWhitelist: cid });
                      setConfirmDelete(-1);
                    }
                  }}
                  onBlur={() => {
                    setConfirmDelete(-1);
                  }}
                >
                  <FontAwesomeIcon
                    icon={confirmDelete == idx ? faCheck : faTrash}
                  />
                </Button>
              </Flex>
            ))}
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
