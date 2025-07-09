class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? {
          $or: [
            {
              username: {
                $regex: this.queryStr.keyword,
                $options: "i",
              },
            },
            {
              name: {
                $regex: this.queryStr.keyword,
                $options: "i",
              },
            },
          ],
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }
  group() {
    const group = this.queryStr.group
      ? {
          $or: [
            {
              isGroupChat: {
                $regex: this.queryStr.group,
                $options: "i",
              },
            },
          ],
        }
      : {};

    this.query = this.query.find({ ...group });
    return this;
  }

  pagination(resultPerPage = 1) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resultPerPage * (currentPage - 1);
    this.query = this.query.limit(resultPerPage).skip(skip);

    return this;
  }
}

export default ApiFeatures;
