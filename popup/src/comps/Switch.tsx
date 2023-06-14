import { Switch as CSwitch, Flex, Text } from "@chakra-ui/react";
import { ChangeEvent } from "react";

export interface Props {
  label: string;
  isChecked?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function Switch({ label, isChecked, onChange }: Props) {
  return (
    <>
      <Flex
        flex="1"
        minWidth="36"
        alignItems="center"
        justifyContent="space-between"
        paddingEnd="4"
      >
        <Text>{label}</Text>
        <CSwitch isChecked={isChecked} onChange={onChange} />
      </Flex>
    </>
  );
}
