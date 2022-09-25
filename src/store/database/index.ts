import { observable } from "mobx";
import Identities from "orbit-db-identity-provider";
import OrbitDB from "orbit-db";
import { User } from "models/user";

export default class DatabaseStore {
  @observable ipfs: any;
  @observable odb: any;
  @observable usersDocStore: any;
  @observable roomsDocStore: any;

  @observable isOnline = false;

  @observable user: User;

  constructor() {
    this.ipfs = null;
    this.odb = null;
    this.usersDocStore = null;
    this.roomsDocStore = null;

    this.user = new User({});
  }

  async connect(ipfs: any, options = {} as any) {
    this.isOnline = false;
    //set up orbitdb
    this.ipfs = ipfs;

    const publicAccess = true;

    const identity = await Identities.createIdentity({ id: "user" });
    this.odb = await OrbitDB.createInstance(ipfs, {
      identity,
      directory: "./odb",
    });
    this.usersDocStore = await this.odb.open("users", {
      create: true,
      overwrite: true,
      localOnly: false,
      type: "docstore",
      accessController: {
        write: publicAccess ? ["*"] : [this.odb.identity.id],
      },
    });

    // const roomIdentity = await Identities.createIdentity({ id: "room" });
    this.roomsDocStore = await this.odb.open("rooms", {
      create: true,
      overwrite: true,
      localOnly: false,
      type: "docstore",
      accessController: {
        write: publicAccess ? ["*"] : [this.odb.identity.id],
      },
    });

    await this.usersDocStore.load();
    await this.roomsDocStore.load();

    const users = await this.usersDocStore.get("");
    const rooms = await this.roomsDocStore.get("");
    console.log("users", users);
    console.log("rooms", rooms);

    this.isOnline = true;
  }
}
