import Bee from 'bee-queue';
import CancellationMail from '../app/jobs/CancellationMail';
import RedisConfig from '../config/redis';

// Importa os jobs e deixa em uma variavel
const jobs = [CancellationMail];

class Queue {
  constructor() {
    // inicia a variavel queues
    this.queues = {};

    this.init();
  }

  // Faz conexao entre redis e jobs
  init() {
    // percorre os jobs e sepera sua chave de sua função.
    jobs.forEach(({ key, handle }) => {
      // adiciona um objeto no array queues com o nome contido na key
      this.queues[key] = {
        // guarda conexao com o redis, e sua função junto
        bee: new Bee(key, {
          redis: RedisConfig,
        }),
        handle,
      };
    });
  }

  // Conexao entre a tarefa do controller e o redis
  // Passa a key e o objeto que contem as infos
  add(queue, objeto) {
    // adiciona a tarefa na fila de queues
    this.queues[queue].bee.createJob(objeto).save();
  }

  // processa tarefa na lista de queues
  processQueue() {
    // busca a key de cada jobs e
    jobs.forEach(job => {
      // caso encontre algo guardado em sua queues[key]
      // coloca nas constantes abaixo
      const { bee, handle } = this.queues[job.key];

      // manda processar a função
      bee.on('failed', this.handleFailure).process(handle);
    });
  }

  handleFailure(job, err) {
    console.log(`Queue ${job.queue.name}: FAILED`, err);
  }
}

export default new Queue();
