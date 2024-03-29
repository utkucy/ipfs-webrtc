import { observable, computed } from "mobx";
import UserStore from "./user";

import { create } from "ipfs";
import * as IPFSClient from "ipfs-http-client";
import OrbitDB from "orbit-db";
import Store from "orbit-db-store";
import DocumentStore from "orbit-db-docstore";
import DatabaseStore from "./database";
// import { Ipfs } from "models/ipfs/index";

export default class AppStore {
  // STORES
  @observable userStore;
  @observable databaseStore;
  @observable isMobile;

  @observable isReady = false;

  constructor() {
    this.databaseStore = new DatabaseStore();
    this.userStore = new UserStore();
    this.isMobile = window.innerWidth < 1000;
  }
}

export const store = new AppStore();
