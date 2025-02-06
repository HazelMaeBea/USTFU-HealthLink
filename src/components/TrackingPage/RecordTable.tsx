import React, { useState } from 'react';
import { Pagination } from 'react-bootstrap';
import styles from './RecordTable.module.css';

interface Record {
  dateTime: string;
  transactionID: string;
  typeOfForm: string;
  status: string;
}

interface RecordTableProps {
  records: Record[];
}

const RecordTable: React.FC<RecordTableProps> = ({ records }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(records.length / recordsPerPage);

  return (
    <div className={styles['table-component-container']}>
      <div className={styles['records-container']}>
        {currentRecords.map((record, index) => (
          <div
            key={index}
            className={`${styles['record-box']} ${record.status === 'Pending' ? styles.pending : ''} ${record.status === 'Approved' ? styles.approved : ''} ${record.status === 'Rejected' ? styles.rejected : ''}`}
          >
            <div className={styles['record-content']}>
              <div className={styles['details-container']}>
                <div className={styles['record-dateTime']}>{record.dateTime}</div>
                <div className={styles['record-transactionID']}>{record.transactionID}</div>
                <div className={styles['record-typeOfForm']}>{record.typeOfForm}</div>
                <div className={styles['record-status']}>{record.status}</div>
              </div>
              <div className={styles['button-container']}>
                <button className={styles['details-button']}>DETAILS</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Pagination>
        <Pagination.Prev
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {[...Array(totalPages)].map((_, index) => (
          <Pagination.Item
            key={index + 1}
            active={index + 1 === currentPage}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    </div>
  );
};

export default RecordTable;
