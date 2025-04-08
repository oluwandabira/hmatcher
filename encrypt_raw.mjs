import { readFile, writeFile } from "fs/promises";
import { encryptMessage } from "./cryptolib.js"

const raw = JSON.parse(await readFile("test_data/raw_messages.json"))

async function encryptRaw(element) {
    const messageData = await encryptMessage(element.name, element.keyword, element.message);
    //console.log(messageData)
    return messageData
}
const xx = await Promise.all(raw.map(encryptRaw));

await writeFile("events/test_event2.json", JSON.stringify(xx))