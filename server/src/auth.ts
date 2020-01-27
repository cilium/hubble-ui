// Copyright 2019 Authors of Hubble
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import * as jsonwebtoken from "jsonwebtoken";
import { User } from "./types";
const jwt = require("express-jwt");

export function getUserFromRequest(req): User {
  const user = req.user;
  if (!user) {
    throw new Error("Unauthorized");
  }
  return new User(user.email, user.email, user.token);
}

export function getTokenFromHeaderOrQueryString(req) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    return req.headers.authorization.split(" ")[1];
  } else if (req.signedCookies && req.signedCookies.accessToken) {
    return req.signedCookies.accessToken;
  } else if (req.query && req.query.accessToken) {
    return req.query.accessToken;
  }
  return null;
}

export async function authenticateStub(req, res, next) {
  req.user = {
    email: "admin@localhost"
  };
  next();
}

export const UnauthorizedError = jwt.UnauthorizedError;
