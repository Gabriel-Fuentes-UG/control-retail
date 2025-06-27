// src/components/common/TableSkeletonLoader.tsx
'use client';

import { Table } from 'react-bootstrap';

interface TableSkeletonLoaderProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeletonLoader({ 
    rows = 5, 
    columns = 4 
}: TableSkeletonLoaderProps) {
  return (
    <div className="skeleton-container">
      <Table striped>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}><div className="skeleton-line skeleton-header"></div></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}><div className="skeleton-line"></div></td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
      
      <style jsx>{`
        .skeleton-container {
          padding: 1rem;
          border-radius: 0.5rem;
        }
        .skeleton-line {
          width: 90%;
          height: 1.2rem;
          border-radius: 0.25rem;
          background-color: #e0e0e0;
          position: relative;
          overflow: hidden;
        }
        .skeleton-header {
            height: 1.5rem;
            width: 70%;
            background-color: #d0d0d0;
        }
        
        .skeleton-line::after {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 150%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            left: -150%;
          }
          100% {
            left: 150%;
          }
        }
      `}</style>
    </div>
  );
}
