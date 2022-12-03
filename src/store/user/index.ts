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
        // address: _room.address.toString(),
      };

      const hash = await store.databaseStore.roomsDocStore.put(room_);
    } catch (error) {
      console.log("create meeting error", error);
    }
  }

  @action.bound
  async getRoom(_id: string) {
    await store.databaseStore.refreshRoom();

    const room = await store.databaseStore.roomsDocStore.get(_id);

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

      const hash = await store.databaseStore.usersDocStore.put(user_);
      return hash;
    } catch (error) {
      console.log("register error", error);
    }
  }

  @action.bound
  async login(email: string, password: string) {
    const user = await store.databaseStore.usersDocStore.query(
      (doc: any) => doc.email === email && doc.password === password
    );

    return user ? user[0] : null;
  }

  @action.bound
  async getUser(_id: string) {
    const user = await store.databaseStore.usersDocStore.query(
      (doc: any) => doc._id === _id
    );
    console.log("USER", user);
    return user ? user[0] : null;
  }

  @action.bound
  async getUsers() {
    const user = await store.databaseStore.usersDocStore.query((doc: any) =>
      console.log("doc", doc._id)
    );
  }

  @action.bound
  async logout() {}
}
