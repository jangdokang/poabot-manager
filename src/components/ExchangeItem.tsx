import React from 'react';
import { Button } from '@patternfly/react-core';

interface ExchangeItemProps {
  href: string;
  name: string;
  types: string;
  discount?: string;
  buttonText?: string;
}

export const ExchangeItem: React.FC<ExchangeItemProps> = ({ 
  href, 
  name, 
  types, 
  discount, 
  buttonText = '가입하고 혜택받기' 
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', marginBottom: '1rem', gap: '1rem' }}>
      <div>
        <strong>{name}</strong> - {types}
        {discount && <span style={{ color: 'green', fontWeight: 'bold', marginLeft: '0.5rem' }}>{discount} 수수료 혜택</span>}
      </div>
      <Button variant="primary" component="a" href={href} target="_blank" rel="noopener noreferrer">
        {buttonText}
      </Button>
    </div>
  );
}; 