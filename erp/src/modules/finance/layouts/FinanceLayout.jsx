import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import FinanceHeader from '../components/FinanceHeader';

const FinanceLayout = () => {
    return (
        <div className="min-h-screen bg-slate-900 relative">
            <div className="relative z-10">
                <FinanceHeader />
                <Outlet />
            </div>
        </div>
    );
};

export default FinanceLayout;
