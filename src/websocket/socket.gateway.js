const socketHandler = (socket) => {
    socket.on("message", (data) => {
        console.log("Mensaje recibido", data)
    });

    socket.on("disconnect", () => {
        console.log("Usuario desconectado");
    })
}

export default socketHandler;