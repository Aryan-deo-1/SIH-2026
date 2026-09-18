import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProcessingAnimation } from '../components/ProcessingAnimation';

export const Processing: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If state contains a target product id, navigate to it after a brief animated display
    const timer = setTimeout(() => {
      if (location.state?.productId) {
        navigate(`/product/${location.state.productId}`);
      } else {
        navigate('/scan');
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [location, navigate]);

  return (
    <div className="py-12 px-4 flex items-center justify-center min-h-[60vh]">
      <ProcessingAnimation />
    </div>
  );
};
