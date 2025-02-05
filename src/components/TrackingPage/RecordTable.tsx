import React, { useState } from 'react';
import { Button, Pagination } from 'react-bootstrap';
import styles from './RecordTable.module.css';

interface Record {
  dateTime: string;
  transactionID: string;
  typeOfForm: string;
  status: string;
}

const RecordTable: React.FC = () => {
  const [records, setRecords] = useState<Record[]>([
    { dateTime: '10/28/2024 - 11:11 AM', transactionID: 'TRN20359211934', typeOfForm: 'In-Patient Form', status: 'Approved' },
    { dateTime: '10/21/2024 - 12:51 PM', transactionID: 'TRN2069211934', typeOfForm: 'Out-Patient Form', status: 'Rejected' },
    { dateTime: '10/18/2024 - 5:55 PM', transactionID: 'TRN2084923523', typeOfForm: 'In-Patient Form', status: 'Rejected' },
    { dateTime: '10/12/2024 - 9:27 PM', transactionID: 'TRN2456245528', typeOfForm: 'Glasses Reimbursement Form', status: 'Approved' },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(records.length / recordsPerPage);

  const addDefaultEntry = () => {
    const newRecord: Record = {
      dateTime: '10/28/2024 - 11:11 AM',
      transactionID: 'TRN20359211934',
      typeOfForm: 'In-Patient Form',
      status: 'Approved',
    };
    setRecords([...records, newRecord]);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className={styles['table-component-container']}>
      <h3>Previous Records</h3> 
      <div className={styles['records-container']}>
        {currentRecords.map((record, index) => (
          <div
            key={index}
            className={`${styles['record-box']} ${record.status === 'Approved' ? styles['approved'] : styles['rejected']}`}
          >
            <div className={styles['record-content']}>
              <div className="details-container">
                <div className={styles['record-dateTime']}>{record.dateTime}</div>
                <div className={styles['record-transactionID']}>Transaction ID: {record.transactionID}</div>
                <div className={styles['record-typeOfForm']}>{record.typeOfForm}</div>
                <div className={styles['record-status']}>{record.status}</div>
              </div>
              <div className="button-container">
                <button className={styles['details-button']}>Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="d-flex justify-content-between align-items-center">
        <Button onClick={addDefaultEntry} variant="success">
          Add Default Entry
        </Button>
        <Pagination>
          {[...Array(totalPages)].map((_, index) => (
            <Pagination.Item
              key={index + 1}
              active={index + 1 === currentPage}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}
        </Pagination>
      </div>
    </div>
  );
};

export default RecordTable;
