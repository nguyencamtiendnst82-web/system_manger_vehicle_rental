import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// =====================================================
// GIA LAP PRISMA CLIENT (MOCK OBJECTS)
// Khong ket noi den co so du lieu MySQL that
// =====================================================

const prisma = {
    $transaction: jest.fn(),
    hop_dong: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
    },
    xe: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
    },
    thanh_toan: {
        aggregate: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
    },
    bao_tri: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
    },
    tinh_trang_tra_xe: {
        create: jest.fn(),
    },
};

// Gia lap doi tuong transaction tx
const tx = {
    xe: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    hop_dong: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    tinh_trang_tra_xe: {
        create: jest.fn(),
    },
    bao_tri: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
};

// Mock module prismaClient truoc khi import chucnang.js
jest.unstable_mockModule('../prismaClient.js', () => ({
    prisma,
}));

// Import cac ham nghiep vu can kiem thu
const {
    createContract,
    confirmContract,
    handOverVehicle,
    returnVehicle,
    cancelContract,
    getContractBalance,
    addPayment,
    startMaintenance,
    completeMaintenance,
    findAvailableVehicles,
    countVehiclesByStatus,
    getMonthlyRevenue,
} = await import('../chucnang.js');

// =====================================================
// 1. UNIT TEST - TAO HOP DONG (createContract)
// =====================================================
describe('Unit Test - Tao hop dong (createContract)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.$transaction.mockImplementation(async (callback) => callback(tx));

        tx.xe.findUnique.mockResolvedValue({
            maXe: 1,
            trangThai: 'SAN_SANG',
        });
        tx.hop_dong.findFirst.mockResolvedValue(null);
        tx.hop_dong.create.mockResolvedValue({
            maHD: 100,
            maXe: 1,
            trangThai: 'CHO_XAC_NHAN',
        });
    });

    test('UT01 - Ngay tra phai sau ngay thue', async () => {
        await expect(
            createContract({
                maKH: 1,
                maXe: 1,
                maNV: 1,
                ngayThue: '2026-11-10',
                ngayTra: '2026-11-09',
                tienThue: 600000,
            })
        ).rejects.toThrow('Ngày trả phải sau ngày thuê');

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test('UT02 - Khong tim thay xe', async () => {
        tx.xe.findUnique.mockResolvedValue(null);

        await expect(
            createContract({
                maKH: 1,
                maXe: 999,
                maNV: 1,
                ngayThue: '2026-11-10',
                ngayTra: '2026-11-12',
                tienThue: 600000,
            })
        ).rejects.toThrow('Không tìm thấy xe');

        expect(tx.hop_dong.create).not.toHaveBeenCalled();
    });

    test('UT03 - Xe dang bao tri khong duoc dat', async () => {
        tx.xe.findUnique.mockResolvedValue({
            maXe: 1,
            trangThai: 'DANG_BAO_TRI',
        });

        await expect(
            createContract({
                maKH: 1,
                maXe: 1,
                maNV: 1,
                ngayThue: '2026-11-10',
                ngayTra: '2026-11-12',
                tienThue: 600000,
            })
        ).rejects.toThrow('Xe đang bảo trì hoặc ngừng hoạt động');

        expect(tx.hop_dong.create).not.toHaveBeenCalled();
    });

    test('UT04 - Xe bi trung lich thue', async () => {
        tx.hop_dong.findFirst.mockResolvedValue({
            maHD: 200,
            maXe: 1,
        });

        await expect(
            createContract({
                maKH: 1,
                maXe: 1,
                maNV: 1,
                ngayThue: '2026-11-10',
                ngayTra: '2026-11-12',
                tienThue: 600000,
            })
        ).rejects.toThrow('Xe đã có hợp đồng khác trong khoảng thời gian này');

        expect(tx.hop_dong.create).not.toHaveBeenCalled();
    });

    test('UT05 - Tao hop dong thanh cong voi trang thai CHO_XAC_NHAN', async () => {
        const ketQua = await createContract({
            maKH: 1,
            maXe: 1,
            maNV: 1,
            ngayThue: '2026-11-10',
            ngayTra: '2026-11-12',
            tienThue: 600000,
        });

        expect(tx.hop_dong.create).toHaveBeenCalledWith({
            data: {
                maKH: 1,
                maXe: 1,
                maNV: 1,
                ngayThue: new Date('2026-11-10'),
                ngayTra: new Date('2026-11-12'),
                tienThue: 600000,
                trangThai: 'CHO_XAC_NHAN',
            },
        });
        expect(ketQua.trangThai).toBe('CHO_XAC_NHAN');
    });
});

// =====================================================
// 2. UNIT TEST - XAC NHAN HOP DONG (confirmContract)
// =====================================================
describe('Unit Test - Xac nhan hop dong (confirmContract)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('UT06 - Bao loi neu hop dong khong ton tai', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue(null);

        await expect(confirmContract(999)).rejects.toThrow('Không tìm thấy hợp đồng');
        expect(prisma.hop_dong.update).not.toHaveBeenCalled();
    });

    test('UT07 - Tu choi neu hop dong khong o trang thai CHO_XAC_NHAN', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({
            maHD: 1,
            trangThai: 'DA_XAC_NHAN',
        });

        await expect(confirmContract(1)).rejects.toThrow('Chỉ xác nhận được hợp đồng đang chờ xác nhận');
        expect(prisma.hop_dong.update).not.toHaveBeenCalled();
    });

    test('UT08 - Xac nhan hop dong thanh cong sang DA_XAC_NHAN', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({
            maHD: 1,
            trangThai: 'CHO_XAC_NHAN',
        });
        prisma.hop_dong.update.mockResolvedValue({
            maHD: 1,
            trangThai: 'DA_XAC_NHAN',
        });

        const ketQua = await confirmContract(1);

        expect(prisma.hop_dong.update).toHaveBeenCalledWith({
            where: { maHD: 1 },
            data: { trangThai: 'DA_XAC_NHAN' },
        });
        expect(ketQua.trangThai).toBe('DA_XAC_NHAN');
    });
});

// =====================================================
// 3. UNIT TEST - GIAO XE CHO KHACH (handOverVehicle)
// =====================================================
describe('Unit Test - Giao xe cho khach (handOverVehicle)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    });

    test('UT09 - Tu choi giao xe neu hop dong chua duoc xac nhan', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({
            maHD: 1,
            maXe: 10,
            trangThai: 'CHO_XAC_NHAN',
            xe: { trangThai: 'SAN_SANG' },
        });

        await expect(handOverVehicle(1)).rejects.toThrow('Hợp đồng phải ở trạng thái đã xác nhận mới giao xe được');
        expect(tx.xe.update).not.toHaveBeenCalled();
    });

    test('UT10 - Tu choi giao xe neu xe dang bao tri hoac ngung hoat dong', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({
            maHD: 1,
            maXe: 10,
            trangThai: 'DA_XAC_NHAN',
            xe: { trangThai: 'DANG_BAO_TRI' },
        });

        await expect(handOverVehicle(1)).rejects.toThrow('Xe đang bảo trì hoặc ngừng hoạt động');
        expect(tx.xe.update).not.toHaveBeenCalled();
    });

    test('UT11 - Giao xe thanh cong cap nhat xe va hop dong sang DANG_THUE', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({
            maHD: 1,
            maXe: 10,
            trangThai: 'DA_XAC_NHAN',
            xe: { trangThai: 'SAN_SANG' },
        });
        tx.xe.update.mockResolvedValue({ maXe: 10, trangThai: 'DANG_THUE' });
        tx.hop_dong.update.mockResolvedValue({ maHD: 1, trangThai: 'DANG_THUE' });

        const ketQua = await handOverVehicle(1);

        expect(tx.xe.update).toHaveBeenCalledWith({
            where: { maXe: 10 },
            data: { trangThai: 'DANG_THUE' },
        });
        expect(tx.hop_dong.update).toHaveBeenCalledWith({
            where: { maHD: 1 },
            data: { trangThai: 'DANG_THUE' },
        });
        expect(ketQua.trangThai).toBe('DANG_THUE');
    });
});

// =====================================================
// 4. UNIT TEST - NHAN TRA XE (returnVehicle)
// =====================================================
describe('Unit Test - Nhan tra xe (returnVehicle)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    });

    test('UT12 - Tu choi tra xe neu hop dong khong o trang thai DANG_THUE', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({
            maHD: 1,
            maXe: 5,
            trangThai: 'DA_XAC_NHAN',
        });

        await expect(returnVehicle(1)).rejects.toThrow('Chỉ trả được xe của hợp đồng đang thuê');
        expect(tx.tinh_trang_tra_xe.create).not.toHaveBeenCalled();
    });

    test('UT13 - Tra xe thanh cong ghi nhan tinh trang va chuyen xe ve SAN_SANG', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({
            maHD: 1,
            maXe: 5,
            trangThai: 'DANG_THUE',
        });
        tx.tinh_trang_tra_xe.create.mockResolvedValue({ maTT: 1 });
        tx.xe.update.mockResolvedValue({ maXe: 5, trangThai: 'SAN_SANG', soKmDaChay: 15000 });
        tx.hop_dong.update.mockResolvedValue({ maHD: 1, trangThai: 'DA_TRA' });

        const ketQua = await returnVehicle(1, {
            tinhTrangXe: 'Binh thuong',
            mucNhienLieu: '100%',
            soKmThucTe: 15000,
            ghiChu: 'Xe sach se',
        });

        expect(tx.tinh_trang_tra_xe.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                maHD: 1,
                tinhTrangXe: 'Binh thuong',
                soKmThucTe: 15000,
            }),
        });
        expect(tx.xe.update).toHaveBeenCalledWith({
            where: { maXe: 5 },
            data: {
                trangThai: 'SAN_SANG',
                soKmDaChay: 15000,
            },
        });
        expect(ketQua.trangThai).toBe('DA_TRA');
    });
});

// =====================================================
// 5. UNIT TEST - HUY HOP DONG (cancelContract)
// =====================================================
describe('Unit Test - Huy hop dong (cancelContract)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('UT14 - Tu choi huy hop dong khi da giao xe', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({
            maHD: 1,
            trangThai: 'DANG_THUE',
        });

        await expect(cancelContract(1)).rejects.toThrow('Chỉ hủy được hợp đồng chưa giao xe');
        expect(prisma.hop_dong.update).not.toHaveBeenCalled();
    });

    test('UT15 - Huy hop dong thanh cong khi dang cho xac nhan hoac da xac nhan', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({
            maHD: 1,
            trangThai: 'CHO_XAC_NHAN',
        });
        prisma.hop_dong.update.mockResolvedValue({
            maHD: 1,
            trangThai: 'DA_HUY',
        });

        const ketQua = await cancelContract(1);

        expect(prisma.hop_dong.update).toHaveBeenCalledWith({
            where: { maHD: 1 },
            data: { trangThai: 'DA_HUY' },
        });
        expect(ketQua.trangThai).toBe('DA_HUY');
    });
});

// =====================================================
// 6. UNIT TEST - CONG NO VA THANH TOAN
// =====================================================
describe('Unit Test - Cong no va thanh toan (getContractBalance & addPayment)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('UT16 - Tinh dung so tien con no hop dong', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({
            maHD: 100,
            tienThue: 900000,
        });
        prisma.thanh_toan.aggregate.mockResolvedValue({
            _sum: { soTien: 300000 },
        });

        const ketQua = await getContractBalance(100);

        expect(ketQua).toEqual({
            maHD: 100,
            tienThue: 900000,
            daThanhToan: 300000,
            conNo: 600000,
        });
    });

    test('UT17 - Bao loi tinh cong no neu hop dong khong ton tai', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue(null);

        await expect(getContractBalance(999)).rejects.toThrow('Không tìm thấy hợp đồng');
        expect(prisma.thanh_toan.aggregate).not.toHaveBeenCalled();
    });

    test('UT18 - Tu choi so tien thanh toan bang 0 hoac am', async () => {
        await expect(addPayment(100, 0, 'TIEN_MAT')).rejects.toThrow('Số tiền phải lớn hơn 0');
        await expect(addPayment(100, -50000, 'CHUYEN_KHOAN')).rejects.toThrow('Số tiền phải lớn hơn 0');
        expect(prisma.thanh_toan.create).not.toHaveBeenCalled();
    });

    test('UT19 - Tu choi thanh toan vuot qua so tien con no', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({
            maHD: 100,
            tienThue: 900000,
        });
        prisma.thanh_toan.aggregate.mockResolvedValue({
            _sum: { soTien: 300000 },
        });

        await expect(addPayment(100, 700000, 'TIEN_MAT')).rejects.toThrow(
            'Số tiền vượt quá số còn nợ (600000)'
        );
        expect(prisma.thanh_toan.create).not.toHaveBeenCalled();
    });

    test('UT20 - Ghi nhan thanh toan hop le', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({
            maHD: 100,
            tienThue: 900000,
        });
        prisma.thanh_toan.aggregate.mockResolvedValue({
            _sum: { soTien: 300000 },
        });
        prisma.thanh_toan.create.mockResolvedValue({
            maHD: 100,
            soTien: 200000,
            phuongThuc: 'TIEN_MAT',
        });

        const ketQua = await addPayment(100, 200000, 'TIEN_MAT');

        expect(prisma.thanh_toan.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                maHD: 100,
                soTien: 200000,
                phuongThuc: 'TIEN_MAT',
                ngayTT: expect.any(Date),
            }),
        });
        expect(ketQua.soTien).toBe(200000);
    });
});

// =====================================================
// 7. UNIT TEST - BAO TRI XE (startMaintenance & completeMaintenance)
// =====================================================
describe('Unit Test - Bao tri xe (startMaintenance & completeMaintenance)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    });

    test('UT21 - Tu choi bao tri neu xe dang duoc thue', async () => {
        tx.xe.findUnique.mockResolvedValue({
            maXe: 1,
            trangThai: 'DANG_THUE',
        });

        await expect(startMaintenance(1, 'Thay nhot')).rejects.toThrow(
            'Xe đang được thuê, không thể bảo trì lúc này'
        );
        expect(tx.bao_tri.create).not.toHaveBeenCalled();
    });

    test('UT22 - Bat dau bao tri thanh cong chuyen xe sang DANG_BAO_TRI', async () => {
        tx.xe.findUnique.mockResolvedValue({
            maXe: 1,
            trangThai: 'SAN_SANG',
        });
        tx.xe.update.mockResolvedValue({ maXe: 1, trangThai: 'DANG_BAO_TRI' });
        tx.bao_tri.create.mockResolvedValue({
            maBT: 1,
            maXe: 1,
            noiDung: 'Thay nhot',
            trangThai: 'DANG_BAO_TRI',
        });

        const ketQua = await startMaintenance(1, 'Thay nhot', 500000);

        expect(tx.xe.update).toHaveBeenCalledWith({
            where: { maXe: 1 },
            data: { trangThai: 'DANG_BAO_TRI' },
        });
        expect(tx.bao_tri.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                maXe: 1,
                noiDung: 'Thay nhot',
                chiPhi: 500000,
                trangThai: 'DANG_BAO_TRI',
            }),
        });
        expect(ketQua.trangThai).toBe('DANG_BAO_TRI');
    });

    test('UT23 - Tu choi hoan thanh phieu bao tri da xong truoc do', async () => {
        tx.bao_tri.findUnique.mockResolvedValue({
            maBT: 5,
            maXe: 1,
            trangThai: 'DA_HOAN_THANH',
        });

        await expect(completeMaintenance(5)).rejects.toThrow('Phiếu này đã hoàn thành');
        expect(tx.xe.update).not.toHaveBeenCalled();
    });

    test('UT24 - Hoan thanh bao tri thanh cong chuyen xe ve SAN_SANG', async () => {
        tx.bao_tri.findUnique.mockResolvedValue({
            maBT: 5,
            maXe: 1,
            trangThai: 'DANG_BAO_TRI',
        });
        tx.xe.update.mockResolvedValue({ maXe: 1, trangThai: 'SAN_SANG' });
        tx.bao_tri.update.mockResolvedValue({
            maBT: 5,
            trangThai: 'DA_HOAN_THANH',
        });

        const ketQua = await completeMaintenance(5, 600000);

        expect(tx.xe.update).toHaveBeenCalledWith({
            where: { maXe: 1 },
            data: { trangThai: 'SAN_SANG' },
        });
        expect(tx.bao_tri.update).toHaveBeenCalledWith({
            where: { maBT: 5 },
            data: expect.objectContaining({
                trangThai: 'DA_HOAN_THANH',
                chiPhi: 600000,
            }),
        });
        expect(ketQua.trangThai).toBe('DA_HOAN_THANH');
    });
});

// =====================================================
// 8. UNIT TEST - TIM KIEM VA THONG KE
// =====================================================
describe('Unit Test - Tim kiem va Thong ke', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('UT25 - Tim xe kha dung loai bo cac xe da co lich ban', async () => {
        prisma.hop_dong.findMany.mockResolvedValue([
            { maXe: 2 },
            { maXe: 3 },
        ]);
        prisma.xe.findMany.mockResolvedValue([
            { maXe: 1, bienSoXe: '43A-11111', trangThai: 'SAN_SANG' },
        ]);

        const ketQua = await findAvailableVehicles('2026-12-01', '2026-12-05');

        expect(prisma.xe.findMany).toHaveBeenCalledWith({
            where: {
                trangThai: { in: ['SAN_SANG', 'DANG_THUE'] },
                maXe: { notIn: [2, 3] },
            },
            include: { loai_xe: true },
        });
        expect(ketQua).toHaveLength(1);
        expect(ketQua[0].maXe).toBe(1);
    });

    test('UT26 - Thong ke so luong xe theo tung trang thai', async () => {
        prisma.xe.groupBy.mockResolvedValue([
            { trangThai: 'SAN_SANG', _count: { _all: 5 } },
            { trangThai: 'DANG_THUE', _count: { _all: 2 } },
        ]);

        const ketQua = await countVehiclesByStatus();

        expect(ketQua).toEqual([
            { trangThai: 'SAN_SANG', soLuong: 5 },
            { trangThai: 'DANG_THUE', soLuong: 2 },
        ]);
    });

    test('UT27 - Thong ke doanh thu theo 12 thang trong nam', async () => {
        prisma.thanh_toan.findMany.mockResolvedValue([
            { ngayTT: new Date(2026, 0, 15), soTien: 1000000 }, // Thang 1 (index 0)
            { ngayTT: new Date(2026, 0, 20), soTien: 500000 },  // Thang 1
            { ngayTT: new Date(2026, 2, 10), soTien: 2000000 }, // Thang 3 (index 2)
        ]);

        const ketQua = await getMonthlyRevenue(2026);

        expect(ketQua).toHaveLength(12);
        expect(ketQua[0]).toEqual({ thang: 1, doanhThu: 1500000 });
        expect(ketQua[1]).toEqual({ thang: 2, doanhThu: 0 });
        expect(ketQua[2]).toEqual({ thang: 3, doanhThu: 2000000 });
    });
});
