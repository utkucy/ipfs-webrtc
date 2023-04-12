import { observable } from "mobx";
import Identities from "orbit-db-identity-provider";
import OrbitDB from "orbit-db";
import { User } from "models/user";
import { CID, create } from "ipfs";

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

  async connect(options = {} as any) {
    this.isOnline = false;

    const ipfs = await create({
      repo: "./ipfs-web3rtc-repo",
      EXPERIMENTAL: { pubsub: true },
      preload: { enabled: false },
      config: {
        Addresses: {
          Swarm: [
            // Use IPFS  webrtc signal server
            "/dns6/ipfs.le-space.de/tcp/9091/wss/p2p-webrtc-star",
            "/dns4/ipfs.le-space.de/tcp/9091/wss/p2p-webrtc-star",
            // Use local signal server
            // '/ip4/0.0.0.0/tcp/9090/wss/p2p-webrtc-star',
          ],
        },
      },
    });

    let _isOnline = false;
    while (!_isOnline) {
      if (ipfs.isOnline()) {
        _isOnline = true;
      }
    }

    //set up orbitdb
    this.ipfs = ipfs;

    const publicAccess = true;

    const identity = await Identities.createIdentity({ id: "user" });
    console.log("identiy", identity);
    this.odb = await OrbitDB.createInstance(ipfs, {
      identity,
      directory: "./odb",
    });

    console.log("odb", this.odb._ipfs);

    this.usersDocStore = await this.odb.open("users", {
      create: true,
      overwrite: true,
      localOnly: false,
      type: "docstore",
      accessController: {
        write: publicAccess ? ["*"] : [this.odb.identity.id],
      },
    });

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

    this.usersDocStore._ipfs.pin.add(
      CID.parse(this.usersDocStore.address.root),
      { recursive: true },
      (err: any) => {
        if (err) {
          console.error("Error pinning userDocStore", err);
        } else {
          console.log("Pinned identity");
        }
      }
    );

    this.roomsDocStore._ipfs.pin.add(
      CID.parse(this.roomsDocStore.address.root),
      { recursive: true },
      (err: any) => {
        if (err) {
          console.error("Error pinning roomDocStore", err);
        } else {
          console.log("Pinned identity");
        }
      }
    );

    this.isOnline = true;
  }

  async refreshRoom() {
    const publicAccess = true;

    const identity = await Identities.createIdentity({ id: "user" });
    this.odb = await OrbitDB.createInstance(this.ipfs, {
      identity,
      directory: "./odb",
    });

    this.roomsDocStore = await this.odb.open("rooms", {
      create: true,
      overwrite: true,
      localOnly: false,
      sync: true,
      type: "docstore",
      accessController: {
        write: publicAccess ? ["*"] : [this.odb.identity.id],
      },
    });

    await this.roomsDocStore.load();
  }
}
