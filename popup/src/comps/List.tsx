import { Button, Flex, Text } from "@chakra-ui/react";
import { faCheck, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export interface Props {
  list: string[];
  onDelete: (item: string) => void;
}

export default function List({ list, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(-1);

  return (
    <>
      {list.map((cid, idx) => (
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
                onDelete(cid);
                setConfirmDelete(-1);
              }
            }}
            onBlur={() => {
              setConfirmDelete(-1);
            }}
          >
            <FontAwesomeIcon icon={confirmDelete == idx ? faCheck : faTrash} />
          </Button>
        </Flex>
      ))}
    </>
  );
}
