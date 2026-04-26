export interface TestCase {
  _id?: string;
  apiName: string;
  title: string;
  requestParams?: any;
  responseData?: any;
  remark?: string;
  tags: string[];
  requestTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TestCaseResponse {
  success: boolean;
  data: TestCase[];
  pagination: PaginationData;
}
