import { Routing } from "express-zod-api";
import { helloWorldEndpoint } from "./endpoints/hello";

export const routing: Routing = {
  hello: helloWorldEndpoint,
};
