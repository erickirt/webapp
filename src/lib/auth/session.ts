import mongodb, { databaseName } from "@/lib/mongodb";
import { OrgniseApiError, handleAndReturnErrorResponse } from "../api/errors";
import { getSearchParams } from "../url";
import { Session, getSession, hashToken } from "./";
import { MongoClient } from "mongodb";


/**
 * @param handler - The handler function to wrap with session management
 * @returns A function that can be used as a Next.js API route handler
 */
interface WithSessionHandler {
  ({
    req,
    params,
    searchParams,
    session,
    client,
  }: {
    req: Request;
    params: Record<string, string>;
    searchParams: Record<string, string>;
    session: Session;
    client: MongoClient;
  }): Promise<Response>;
}

/**
 * Wraps a handler function with session management
 * @param handler - The handler function to wrap with session management
 * @returns A function that can be used as a Next.js API route handler
 */
export const withSession =
  (handler: WithSessionHandler) =>
    async (req: Request, { params }: { params: Record<string, string> }) => {
      try {

        const client = await mongodb;
        let session = await generateSession(req, client);

        const searchParams = getSearchParams(req.url);
        return await handler({ req, params, searchParams, session, client });
      } catch (error: any) {
        return handleAndReturnErrorResponse(error);
      }
    };

export async function generateSession(req: Request, client: MongoClient): Promise<Session> {
  const authorizationHeader = req.headers.get("Authorization");
  let session: Session | undefined;
  if (authorizationHeader) {
    if (!authorizationHeader.includes("Bearer ")) {
      throw new OrgniseApiError({
        code: "bad_request",
        message:
          "Misconfigured authorization header. Did you forget to add 'Bearer '? Learn more: https://docs.orgnise.in/api-reference/introduction#authentication",
      });
    }

    const apiKey = authorizationHeader.replace("Bearer ", "");
    if (!apiKey || apiKey === "") {
      throw new OrgniseApiError({
        code: "bad_request",
        message: "Invalid API key",
      });
    }
    const hashedKey = hashToken(apiKey, {
      noSecret: true,
    });

    const userCollection = client.db(databaseName).collection("users");

    const user = await userCollection.findOne({
      _id: {
        $in: await client.db(databaseName).collection("token")
          .distinct("user", { hashedKey })
      }
    }, { projection: { name: 1, email: 1, image: 1 } });

    if (!user) {
      throw new OrgniseApiError({
        code: "unauthorized",
        message: `Unauthorized: Invalid API key: ${apiKey}`,
        docUrl: 'https://docs.orgnise.in/api-reference/introduction#authentication'
      });
    }

    session = {
      user: {
        id: user._id.toString(),
        name: user.name || "",
        email: user.email || "",
      },
    };
  } else {
    session = await getSession();
  }
  if (!session?.user.id) {
    throw new OrgniseApiError({
      code: "unauthorized",
      message: "Unauthorized: Login required.",
    });
  }
  return session;
}