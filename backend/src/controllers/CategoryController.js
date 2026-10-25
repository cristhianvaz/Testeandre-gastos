export class CategoryController {
  #categories;

  constructor({ categories }) {
    // Palavras-chave são detalhe interno da engine; não são expostas na API.
    this.#categories = categories.map(({ id, name, icon }) => ({ id, name, icon }));
  }

  list = (_req, res) => {
    res.json(this.#categories);
  };
}
