import cluster from "cluster";
import os from "os";
import { startServer } from ".";

const numberOfCores = os.cpus().length;

if(cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);
    console.log(`Number of CPU cores: ${numberOfCores}`);
    console.log(`Server started on port ${process.env.PORT || 3000}`);

    for(let i=0; i<numberOfCores; i++) {
        cluster.fork();
    }
} else {
    console.log(`Worker ${process.pid} started`);
    startServer();
}