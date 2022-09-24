import { action, computed, observable } from "mobx";
import { Room } from "models/room";
import { User } from "models/user";
import { store } from "store";

export default class UserStore {
  @observable user: User;

  constructor() {
    this.user = new User({});
  }

  setUser(user: User) {
    this.user = new User(user);
  }

  @action.bound
  async createMeeting(room: Room) {
    try {
      const _room = await store.databaseStore.odb.docstore("rooms", {
        accessController: {
          type: "orbitdb",
          write: [store.databaseStore.odb.identity.id],
        },
      });

      const room_ = {
        ...room,
        _id: room.room_id,
        address: _room.address.toString(),
      };

      console.log("room_", room_);

      const hash = await store.databaseStore.roomsDocStore.put(room_);
    } catch (error) {
      console.log("create meeting error", error);
    }
  }

  @action.bound
  async getRoom(_id: string) {
    console.log("room id", _id);
    const room = await store.databaseStore.roomsDocStore.query(
      (doc: any) => doc.room_id === _id
    );

    console.log("ROOM", room);
    return !!room ? room[0] : undefined;
  }

  @action.bound
  async register(data: User) {
    try {
      const user = await store.databaseStore.odb.docstore("users", {
        accessController: {
          type: "orbitdb",
          write: [store.databaseStore.odb.identity.id],
        },
        // indexBy: "user.email",
      });
      const user_ = {
        ...data,
        address: user.address.toString(),
      };

      console.log("register", store.databaseStore.usersDocStore);
      //next we add it to our saved playlists feed
      const hash = await store.databaseStore.usersDocStore.put(user_);
      console.log("hash", hash);
      return hash;
    } catch (error) {
      console.log("register error", error);
    }
  }

  @action.bound
  async login(email: string, password: string) {
    const user = store.databaseStore.usersDocStore.query(
      (doc: any) => doc.email === email && doc.password === password
    );

    return user ? user[0] : null;
  }

  @action.bound
  getUser(_id: string) {
    const user = store.databaseStore.usersDocStore.query(
      (doc: any) => doc._id === _id
    );
    return user ? user[0] : null;
  }

  @action.bound
  async logout() {}
}
