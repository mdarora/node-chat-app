const users = [];

const addUser = (id, room, dbID) => {
    
    const existingUser = users.find((user) => user.room === room && user.id === id);
    const user = { id, room , dbID};
    if(existingUser) return {user};

    users.push(user);
    return { user };
}

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if(index !== -1) return users.splice(index, 1)[0];
}

const getUser = (id) => users.find((user) => user.id === id);

const getUsersInRoom = (room) => users.filter((user) => user.room === room);
const getUsersBydbID = (id) => users.filter((user) => user.dbID === id);

module.exports = { addUser, removeUser, getUser, getUsersInRoom, getUsersBydbID};