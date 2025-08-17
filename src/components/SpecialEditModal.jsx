// --- START OF FILE src/components/SpecialEditModal.jsx ---
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { getCommissionTiers, updateCommissionTiers } from '../api/apiService';

// MODIFIED: Added 'useTieredCommission' and 'setUseTieredCommission' props
function SpecialEditModal({ isOpen, onClose,onTiersUpdated }) {
    const modalRef = useRef(null);
    const [tiers, setTiers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            modalRef.current?.showModal();
            fetchTiers();
        } else {
            modalRef.current?.close();
        }
    }, [isOpen]);

    const fetchTiers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getCommissionTiers();
            setTiers(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to load commission data.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (index, value) => {
        const newTiers = [...tiers];
const percentageValue = value === '' ? '' : parseFloat(value);
if (!isNaN(percentageValue)) {
    newTiers[index].percentage = percentageValue;
}
setTiers(newTiers);
    };

    const handleUpdateCommission = async () => {
        setIsLoading(true);
        try {
            await updateCommissionTiers(tiers);
            Swal.fire('Success', 'Commission table has been updated!', 'success');
           
            if (onTiersUpdated) {
              onTiersUpdated();
            }

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update commissions.';
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <dialog id="special_edit_modal" className="modal" ref={modalRef}>
            <div className="modal-box w-11/12 max-w-lg bg-base-200 text-base-content">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Commission Settings</h3>
                    <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
                </div>
                
                {isLoading && <div className="text-center p-8"><span className="loading loading-spinner"></span></div>}
                {error && <div className="text-center p-8 text-error">{error}</div>}

                {!isLoading && !error && (
                    <div className="space-y-4 p-4 bg-base-100 rounded-lg">
                        
                 

                        {tiers.map((tier, index) => (
                            <div key={tier._id} className="grid grid-cols-3 items-center gap-4">
                                <label className="font-semibold text-right">{tier.label}</label>
                                <input
                                    type="number"
                                    value={tier.percentage}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className="input input-bordered w-full col-span-1"
                                    min="0"
                                    max="100"
                                />
                                <span className="text-left font-semibold">%</span>
                            </div>
                        ))}
                        <div className="flex justify-end pt-4">
                            <button 
                                className="btn btn-primary" 
                                onClick={handleUpdateCommission}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Updating...' : 'Update Commission Table'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </dialog>
    );
}

export default SpecialEditModal;