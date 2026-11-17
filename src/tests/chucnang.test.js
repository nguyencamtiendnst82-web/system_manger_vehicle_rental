import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// =====================================================
// GIA LAP PRISMA CLIENT (MOCK OBJECTS)
// Khong ket noi den co so du lieu MySQL that
// =====================================================

const prisma = {
    $transaction: jest.fn(),
    hop_dong: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        groupBy: jest.fn(),
    },
    xe: {
        findMany: jest.fn(),
        groupBy: jest.fn(),
    },
    thanh_toan: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
    },
    hoan_tien: { aggregate: jest.fn(), findMany: jest.fn() },
    bao_tri: {
        groupBy: jest.fn(),
    },
};

// Gia lap doi tuong transaction tx
const tx = {
    $queryRaw: jest.fn(),
    xe: { findUnique: jest.fn(), update: jest.fn() },
    khach_hang: { findUnique: jest.fn() },
    nhan_vien: { findUnique: jest.fn() },
    hop_dong: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
    },
    tinh_trang_tra_xe: { create: jest.fn() },
    thanh_toan: { aggregate: jest.fn(), create: jest.fn() },
    hoan_tien: { aggregate: jest.fn(), create: jest.fn() },
    bao_tri: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
    },
};

// Mock module prismaClient truoc khi import chucnang.js
jest.unstable_mockModule('../prismaClient.js', () => ({
    prisma,
}));

const {
    createContract,
    confirmContract,
    handOverVehicle,
    returnVehicle,
    cancelContract,
    reassignVehicle,
    getAtRiskContracts,
    calcLateFee,
    calcRefundRate,
    getContractBalance,
    addPayment,
    startMaintenance,
    completeMaintenance,
    findAvailableVehicles,
    countVehiclesByStatus,
    getMonthlyRevenue,
    getMaintenanceCostByVehicle,
    getMostRentedVehicles,
    getOverdueContracts,
} = await import('../chucnang.js');

// Dat lai mock + gia tri mac dinh "moi thu hop le" truoc moi test
beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    tx.xe.findUnique.mockResolvedValue({
        maXe: 1,
        trangThai: 'SAN_SANG',
        soKmDaChay: 1000,
        loai_xe: { giaThueNgay: 500000 },
    });
    tx.khach_hang.findUnique.mockResolvedValue({ maKH: 1 });
    tx.nhan_vien.findUnique.mockResolvedValue({ maNV: 1 });
    tx.hop_dong.findFirst.mockResolvedValue(null);
    tx.hop_dong.create.mockResolvedValue({ maHD: 100, maXe: 1, trangThai: 'CHO_XAC_NHAN' });
    tx.hop_dong.updateMany.mockResolvedValue({ count: 1 });
    tx.bao_tri.updateMany.mockResolvedValue({ count: 1 });
    tx.bao_tri.count.mockResolvedValue(0);
    tx.hoan_tien.aggregate.mockResolvedValue({ _sum: { soTien: null } });
    prisma.hoan_tien.aggregate.mockResolvedValue({ _sum: { soTien: null } });
    prisma.hoan_tien.findMany.mockResolvedValue([]);
});

const newContract = (extra = {}) => ({
    maKH: 1,
    maXe: 1,
    maNV: 1,
    ngayThue: '2026-11-10',
    ngayTra: '2026-11-12',
    tienThue: 600000,
    ...extra,
});

// =====================================================
// 1. TAO HOP DONG (createContract)
// =====================================================
describe('Unit Test - Tao hop dong (createContract)', () => {
    test('UT01 - Ngay tra phai sau ngay thue', async () => {
        await expect(
            createContract(newContract({ ngayThue: '2026-11-10', ngayTra: '2026-11-09' }))
        ).rejects.toThrow('Ngày trả phải sau ngày thuê');
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test('UT02 - Khong tim thay xe', async () => {
        tx.xe.findUnique.mockResolvedValue(null);
        await expect(createContract(newContract({ maXe: 999 }))).rejects.toThrow('Không tìm thấy xe');
        expect(tx.hop_dong.create).not.toHaveBeenCalled();
    });

    test('UT03 - Xe dang bao tri khong duoc dat', async () => {
        tx.xe.findUnique.mockResolvedValue({ maXe: 1, trangThai: 'DANG_BAO_TRI' });
        await expect(createContract(newContract())).rejects.toThrow('Xe đang bảo trì hoặc ngừng hoạt động');
        expect(tx.hop_dong.create).not.toHaveBeenCalled();
    });

    test('UT04 - Xe bi trung lich thue', async () => {
        tx.hop_dong.findFirst.mockResolvedValue({ maHD: 200, maXe: 1 });
        await expect(createContract(newContract())).rejects.toThrow(
            'Xe đã có hợp đồng khác trong khoảng thời gian này'
        );
        expect(tx.hop_dong.create).not.toHaveBeenCalled();
    });

    test('UT05 - Tao hop dong thanh cong voi trang thai CHO_XAC_NHAN', async () => {
        const ketQua = await createContract(newContract());
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

    test('UT28 - Ngay thue/tra khong hop le (chuoi rac)', async () => {
        await expect(createContract(newContract({ ngayThue: 'abc' }))).rejects.toThrow('Ngày thuê không hợp lệ');
        await expect(createContract(newContract({ ngayTra: undefined }))).rejects.toThrow('Ngày trả không hợp lệ');
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test('UT29 - Tien thue am bi tu choi', async () => {
        await expect(createContract(newContract({ tienThue: -1 }))).rejects.toThrow('Tiền thuê không hợp lệ');
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test('UT30 - Khong truyen tienThue thi tu tinh theo gia thue ngay (2 ngay x 500000)', async () => {
        await createContract(newContract({ tienThue: undefined }));
        expect(tx.hop_dong.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ tienThue: 1000000 }),
        });
    });

    test('UT85 - Gia thue ngay bi thieu thi tien thue mac dinh bang 0', async () => {
        tx.xe.findUnique.mockResolvedValue({
            maXe: 1,
            trangThai: 'SAN_SANG',
            loai_xe: {},
        });
        await createContract(newContract({ tienThue: undefined }));
        expect(tx.hop_dong.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ tienThue: 0 }),
        });
    });

    test('UT31 - Khach hang hoac nhan vien khong ton tai', async () => {
        tx.khach_hang.findUnique.mockResolvedValue(null);
        await expect(createContract(newContract({ maKH: 99 }))).rejects.toThrow('Không tìm thấy khách hàng');
        tx.khach_hang.findUnique.mockResolvedValue({ maKH: 1 });
        tx.nhan_vien.findUnique.mockResolvedValue(null);
        await expect(createContract(newContract({ maNV: 99 }))).rejects.toThrow('Không tìm thấy nhân viên');
        expect(tx.hop_dong.create).not.toHaveBeenCalled();
    });

    test('UT32 - Khoa dong xe (FOR UPDATE) truoc khi kiem tra trung lich', async () => {
        await createContract(newContract());
        expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
        expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
            tx.hop_dong.findFirst.mock.invocationCallOrder[0]
        );
    });
});

// =====================================================
// 2. XAC NHAN HOP DONG (confirmContract)
// =====================================================
describe('Unit Test - Xac nhan hop dong (confirmContract)', () => {
    test('UT06 - Bao loi neu hop dong khong ton tai', async () => {
        prisma.hop_dong.updateMany.mockResolvedValue({ count: 0 });
        prisma.hop_dong.findUnique.mockResolvedValue(null);
        await expect(confirmContract(999)).rejects.toThrow('Không tìm thấy hợp đồng');
    });

    test('UT07 - Tu choi neu hop dong khong o trang thai CHO_XAC_NHAN', async () => {
        prisma.hop_dong.updateMany.mockResolvedValue({ count: 0 });
        prisma.hop_dong.findUnique.mockResolvedValue({ maHD: 1, trangThai: 'DA_XAC_NHAN' });
        await expect(confirmContract(1)).rejects.toThrow('Chỉ xác nhận được hợp đồng đang chờ xác nhận');
    });

    test('UT08 - Xac nhan thanh cong sang DA_XAC_NHAN (doi trang thai co dieu kien)', async () => {
        prisma.hop_dong.updateMany.mockResolvedValue({ count: 1 });
        prisma.hop_dong.findUnique.mockResolvedValue({ maHD: 1, trangThai: 'DA_XAC_NHAN' });
        const ketQua = await confirmContract(1);
        expect(prisma.hop_dong.updateMany).toHaveBeenCalledWith({
            where: { maHD: 1, trangThai: 'CHO_XAC_NHAN' },
            data: { trangThai: 'DA_XAC_NHAN' },
        });
        expect(ketQua.trangThai).toBe('DA_XAC_NHAN');
    });
});

// =====================================================
// 3. GIAO XE (handOverVehicle)
// =====================================================
describe('Unit Test - Giao xe cho khach (handOverVehicle)', () => {
    beforeEach(() => {
        tx.hop_dong.findUnique.mockResolvedValue({ maHD: 1, maXe: 1, trangThai: 'DA_XAC_NHAN' });
    });

    test('UT09 - Tu choi giao xe neu hop dong chua duoc xac nhan', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({ maHD: 1, maXe: 1, trangThai: 'CHO_XAC_NHAN' });
        await expect(handOverVehicle(1)).rejects.toThrow('Hợp đồng phải ở trạng thái đã xác nhận mới giao xe được');
        expect(tx.xe.update).not.toHaveBeenCalled();
    });

    test('UT10 - Tu choi giao xe neu xe dang bao tri hoac ngung hoat dong', async () => {
        for (const trangThai of ['DANG_BAO_TRI', 'NGUNG_HOAT_DONG']) {
            tx.xe.findUnique.mockResolvedValue({ maXe: 1, trangThai });
            await expect(handOverVehicle(1)).rejects.toThrow('Xe đang bảo trì hoặc ngừng hoạt động');
        }
        expect(tx.xe.update).not.toHaveBeenCalled();
    });

    test('UT33 - Tu choi giao xe neu xe dang duoc khach khac thue (chua tra)', async () => {
        tx.xe.findUnique.mockResolvedValue({ maXe: 1, trangThai: 'DANG_THUE' });
        await expect(handOverVehicle(1)).rejects.toThrow('Xe đang được khách khác thuê, chưa được trả');
        expect(tx.xe.update).not.toHaveBeenCalled();
    });

    test('UT11 - Giao xe thanh cong cap nhat xe va hop dong sang DANG_THUE', async () => {
        tx.hop_dong.findUnique
            .mockResolvedValueOnce({ maHD: 1, maXe: 1, trangThai: 'DA_XAC_NHAN' })
            .mockResolvedValueOnce({ maHD: 1, maXe: 1, trangThai: 'DANG_THUE' });
        const ketQua = await handOverVehicle(1);
        expect(tx.hop_dong.updateMany).toHaveBeenCalledWith({
            where: { maHD: 1, trangThai: 'DA_XAC_NHAN' },
            data: { trangThai: 'DANG_THUE' },
        });
        expect(tx.xe.update).toHaveBeenCalledWith({ where: { maXe: 1 }, data: { trangThai: 'DANG_THUE' } });
        expect(ketQua.trangThai).toBe('DANG_THUE');
    });

    test('UT34 - Hop dong bi doi trang thai giua chung (huy cung luc) thi khong giao xe', async () => {
        tx.hop_dong.updateMany.mockResolvedValue({ count: 0 });
        await expect(handOverVehicle(1)).rejects.toThrow('Hợp đồng vừa bị thay đổi');
        expect(tx.xe.update).not.toHaveBeenCalled();
    });
});

// =====================================================
// 4. TRA XE (returnVehicle)
// =====================================================
describe('Unit Test - Nhan tra xe (returnVehicle)', () => {
    beforeEach(() => {
        tx.hop_dong.findUnique.mockResolvedValue({ maHD: 1, maXe: 1, trangThai: 'DANG_THUE' });
    });

    test('UT12 - Tu choi tra xe neu hop dong khong o trang thai DANG_THUE', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({ maHD: 1, maXe: 1, trangThai: 'DA_XAC_NHAN' });
        await expect(returnVehicle(1, {})).rejects.toThrow('Chỉ trả được xe của hợp đồng đang thuê');
        expect(tx.tinh_trang_tra_xe.create).not.toHaveBeenCalled();
    });

    test('UT13 - Tra xe thanh cong ghi nhan tinh trang va chuyen xe ve SAN_SANG', async () => {
        tx.hop_dong.findUnique
            .mockResolvedValueOnce({ maHD: 1, maXe: 1, trangThai: 'DANG_THUE', ngayTra: new Date('2099-01-01') })
            .mockResolvedValueOnce({ maHD: 1, maXe: 1, trangThai: 'DA_TRA' });
        const ketQua = await returnVehicle(1, {
            tinhTrangXe: 'Tot',
            mucNhienLieu: 70,
            soKmThucTe: 1300,
            ghiChu: 'Binh thuong',
        });
        expect(tx.tinh_trang_tra_xe.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ maHD: 1, tinhTrangXe: 'Tot', mucNhienLieu: 70, soKmThucTe: 1300 }),
        });
        expect(tx.xe.update).toHaveBeenCalledWith({
            where: { maXe: 1 },
            data: { trangThai: 'SAN_SANG', soKmDaChay: 1300 },
        });
        expect(tx.hop_dong.updateMany).toHaveBeenCalledWith({
            where: { maHD: 1, trangThai: 'DANG_THUE' },
            data: { trangThai: 'DA_TRA', ngayTraThucTe: expect.any(Date), phiTraTre: 0 },
        });
        expect(ketQua.trangThai).toBe('DA_TRA');
    });

    test('UT88 - Co the tra xe ma khong truyen thong tin chi tiet', async () => {
        tx.hop_dong.findUnique
            .mockResolvedValueOnce({ maHD: 1, maXe: 1, trangThai: 'DANG_THUE', ngayTra: new Date('2099-01-01') })
            .mockResolvedValueOnce({ maHD: 1, maXe: 1, trangThai: 'DA_TRA' });
        await returnVehicle(1);
        expect(tx.tinh_trang_tra_xe.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                tinhTrangXe: null,
                mucNhienLieu: null,
                soKmThucTe: null,
                ghiChu: null,
            }),
        });
    });

    test('UT52 - Tra xe tre ~5.5 gio: phi = 6 gio x (480000/24) x 1.5 = 180000', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({
            maHD: 1, maXe: 1, trangThai: 'DANG_THUE', ngayTra: new Date(Date.now() - 5.5 * 3600 * 1000),
        });
        tx.xe.findUnique.mockResolvedValue({ maXe: 1, trangThai: 'DANG_THUE', soKmDaChay: 1000, loai_xe: { giaThueNgay: 480000 } });
        await returnVehicle(1, {});
        expect(tx.hop_dong.updateMany).toHaveBeenCalledWith({
            where: { maHD: 1, trangThai: 'DANG_THUE' },
            data: expect.objectContaining({ phiTraTre: 180000 }),
        });
    });

    test('UT35 - Muc nhien lieu ngoai khoang 0-100 bi tu choi', async () => {
        await expect(returnVehicle(1, { mucNhienLieu: 150 })).rejects.toThrow('Mức nhiên liệu phải là số nguyên từ 0 đến 100');
        await expect(returnVehicle(1, { mucNhienLieu: -1 })).rejects.toThrow('Mức nhiên liệu');
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test('UT36 - So km thuc te nho hon km hien tai cua xe bi tu choi', async () => {
        await expect(returnVehicle(1, { soKmThucTe: 500 })).rejects.toThrow('Số km thực tế không được nhỏ hơn');
        expect(tx.tinh_trang_tra_xe.create).not.toHaveBeenCalled();
        expect(tx.xe.update).not.toHaveBeenCalled();
    });

    test('UT81 - So km thuc te am, khong nguyen hoac sai kieu bi tu choi', async () => {
        for (const soKmThucTe of [-1, 1200.5, '1200', NaN]) {
            await expect(returnVehicle(1, { soKmThucTe })).rejects.toThrow('Số km thực tế không hợp lệ');
        }
        expect(prisma.$transaction).not.toHaveBeenCalled();
        expect(tx.tinh_trang_tra_xe.create).not.toHaveBeenCalled();
    });

    test('UT37 - Hop dong bi doi trang thai giua chung thi khong ghi nhan tra xe', async () => {
        tx.hop_dong.updateMany.mockResolvedValue({ count: 0 });
        await expect(returnVehicle(1, { soKmThucTe: 1300 })).rejects.toThrow('Hợp đồng vừa bị thay đổi');
        expect(tx.tinh_trang_tra_xe.create).not.toHaveBeenCalled();
    });
});

// =====================================================
// 5. HUY HOP DONG (cancelContract)
// =====================================================
describe('Unit Test - Huy hop dong va hoan tien (cancelContract)', () => {
    const contractAt = (trangThai, ngayThue) => ({ maHD: 1, trangThai, ngayThue, tienThue: 1000000 });
    const inDays = (n) => new Date(Date.now() + n * 24 * 3600 * 1000);

    beforeEach(() => {
        tx.thanh_toan.aggregate.mockResolvedValue({ _sum: { soTien: 600000 } });
        tx.hoan_tien.create.mockImplementation(async ({ data }) => ({ maHT: 1, ...data }));
    });

    test('UT14 - Tu choi huy hop dong khi da giao xe', async () => {
        tx.hop_dong.findUnique.mockResolvedValue(contractAt('DANG_THUE', inDays(-1)));
        await expect(cancelContract(1)).rejects.toThrow('Chỉ hủy được hợp đồng chưa giao xe');
        expect(tx.hop_dong.updateMany).not.toHaveBeenCalled();
        expect(tx.hoan_tien.create).not.toHaveBeenCalled();
    });

    test('UT15 - Huy khi cho xac nhan: hoan 100% so tien da tra', async () => {
        tx.hop_dong.findUnique
            .mockResolvedValueOnce(contractAt('CHO_XAC_NHAN', inDays(0.1)))
            .mockResolvedValueOnce({ maHD: 1, trangThai: 'DA_HUY' });
        const { hopDong, hoanTien } = await cancelContract(1);
        expect(tx.hop_dong.updateMany).toHaveBeenCalledWith({
            where: { maHD: 1, trangThai: { in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN'] } },
            data: { trangThai: 'DA_HUY' },
        });
        expect(hopDong.trangThai).toBe('DA_HUY');
        expect(hoanTien.soTien).toBe(600000);
    });

    test('UT38 - Huy hop dong khong ton tai', async () => {
        tx.hop_dong.findUnique.mockResolvedValue(null);
        await expect(cancelContract(999)).rejects.toThrow('Không tìm thấy hợp đồng');
    });

    test('UT53 - Da xac nhan, huy truoc gio thue >= 24h: hoan 100%', async () => {
        tx.hop_dong.findUnique.mockResolvedValue(contractAt('DA_XAC_NHAN', inDays(3)));
        const { hoanTien } = await cancelContract(1);
        expect(hoanTien.soTien).toBe(600000);
    });

    test('UT54 - Da xac nhan, huy muon (< 24h): hoan 70% = 420000', async () => {
        tx.hop_dong.findUnique.mockResolvedValue(contractAt('DA_XAC_NHAN', inDays(0.2)));
        const { hoanTien } = await cancelContract(1);
        expect(hoanTien.soTien).toBe(420000);
        expect(hoanTien.lyDo).toContain('70%');
    });

    test('UT55 - Chua thanh toan gi thi khong tao khoan hoan tien', async () => {
        tx.hop_dong.findUnique.mockResolvedValue(contractAt('CHO_XAC_NHAN', inDays(5)));
        tx.thanh_toan.aggregate.mockResolvedValue({ _sum: { soTien: null } });
        const { hoanTien } = await cancelContract(1);
        expect(hoanTien).toBeNull();
        expect(tx.hoan_tien.create).not.toHaveBeenCalled();
    });

    test('UT56 - Tru di so tien da hoan truoc do', async () => {
        tx.hop_dong.findUnique.mockResolvedValue(contractAt('CHO_XAC_NHAN', inDays(5)));
        tx.hoan_tien.aggregate.mockResolvedValue({ _sum: { soTien: 600000 } });
        const { hoanTien } = await cancelContract(1);
        expect(hoanTien).toBeNull();
    });

    test('UT57 - Khoa hop dong truoc khi tinh tien hoan (chong thanh toan chen ngang)', async () => {
        tx.hop_dong.findUnique.mockResolvedValue(contractAt('CHO_XAC_NHAN', inDays(5)));
        await cancelContract(1);
        expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
            tx.thanh_toan.aggregate.mock.invocationCallOrder[0]
        );
    });

    test('UT80 - Bao loi neu hop dong bi doi trang thai truoc khi huy', async () => {
        tx.hop_dong.findUnique.mockResolvedValue(contractAt('CHO_XAC_NHAN', inDays(5)));
        tx.hop_dong.updateMany.mockResolvedValue({ count: 0 });
        await expect(cancelContract(1)).rejects.toThrow('Hợp đồng vừa bị thay đổi');
        expect(tx.thanh_toan.aggregate).not.toHaveBeenCalled();
        expect(tx.hoan_tien.create).not.toHaveBeenCalled();
    });
});

describe('Unit Test - Chinh sach phi tre va ty le hoan (ham thuan)', () => {
    test('UT58 - calcLateFee: dung han / trong 60 phut an han = 0', () => {
        expect(calcLateFee('2026-11-10T08:00:00Z', '2026-11-10T07:00:00Z', 480000)).toBe(0);
        expect(calcLateFee('2026-11-10T08:00:00Z', '2026-11-10T09:00:00Z', 480000)).toBe(0);
    });

    test('UT59 - calcLateFee: tre 61 phut -> 2 gio x 20000 x 1.5 = 60000', () => {
        expect(calcLateFee('2026-11-10T08:00:00Z', '2026-11-10T09:01:00Z', 480000)).toBe(60000);
    });

    test('UT60 - calcLateFee: tre dung 1 ngay -> 24 gio x 20000 x 1.5 = 720000', () => {
        expect(calcLateFee('2026-11-10T08:00:00Z', '2026-11-11T08:00:00Z', 480000)).toBe(720000);
    });

    test('UT61 - calcRefundRate', () => {
        const now = new Date('2026-11-10T00:00:00Z');
        expect(calcRefundRate('CHO_XAC_NHAN', '2026-11-10T01:00:00Z', now)).toBe(1);
        expect(calcRefundRate('DA_XAC_NHAN', '2026-11-11T00:00:00Z', now)).toBe(1);
        expect(calcRefundRate('DA_XAC_NHAN', '2026-11-10T23:59:00Z', now)).toBe(0.7);
    });

    test('UT86 - calcLateFee mac dinh gia thue thieu bang 0', () => {
        expect(calcLateFee('2026-11-10T08:00:00Z', '2026-11-10T09:01:00Z')).toBe(0);
    });

    test('UT87 - calcRefundRate mac dinh thoi diem tinh la hien tai', () => {
        const rentDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        expect(calcRefundRate('DA_XAC_NHAN', rentDate)).toBe(1);
    });
});

// =====================================================
// 6. CONG NO VA THANH TOAN
// =====================================================
describe('Unit Test - Cong no va thanh toan (getContractBalance & addPayment)', () => {
    beforeEach(() => {
        prisma.hop_dong.findUnique.mockResolvedValue({ maHD: 1, tienThue: 3000000, phiTraTre: 0, trangThai: 'DANG_THUE' });
        prisma.thanh_toan.aggregate.mockResolvedValue({ _sum: { soTien: 1000000 } });
        tx.hop_dong.findUnique.mockResolvedValue({ maHD: 1, tienThue: 3000000, trangThai: 'DA_XAC_NHAN' });
        tx.thanh_toan.aggregate.mockResolvedValue({ _sum: { soTien: 1000000 } });
        tx.thanh_toan.create.mockResolvedValue({ maTT: 9 });
    });

    test('UT16 - Tinh dung so tien con no hop dong', async () => {
        expect(await getContractBalance(1)).toEqual({
            maHD: 1,
            tienThue: 3000000,
            phiTraTre: 0,
            daThanhToan: 1000000,
            daHoan: 0,
            conNo: 2000000,
        });
    });

    test('UT62 - Cong no gom phi tra tre va tru tien da hoan', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({ maHD: 1, tienThue: 3000000, phiTraTre: 200000, trangThai: 'DA_TRA' });
        prisma.hoan_tien.aggregate.mockResolvedValue({ _sum: { soTien: 100000 } });
        expect(await getContractBalance(1)).toEqual({
            maHD: 1, tienThue: 3000000, phiTraTre: 200000, daThanhToan: 1000000, daHoan: 100000,
            conNo: 3000000 + 200000 - (1000000 - 100000),
        });
    });

    test('UT63 - Hop dong da huy khong con no', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({ maHD: 1, tienThue: 3000000, phiTraTre: 0, trangThai: 'DA_HUY' });
        expect((await getContractBalance(1)).conNo).toBe(0);
    });

    test('UT89 - Gia thue bi thieu duoc tinh bang 0 khi tinh cong no', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({ maHD: 1, trangThai: 'DA_TRA' });
        prisma.thanh_toan.aggregate.mockResolvedValue({ _sum: { soTien: null } });
        prisma.hoan_tien.aggregate.mockResolvedValue({ _sum: { soTien: null } });
        expect(await getContractBalance(1)).toEqual({
            maHD: 1,
            tienThue: 0,
            phiTraTre: 0,
            daThanhToan: 0,
            daHoan: 0,
            conNo: 0,
        });
    });

    test('UT17 - Bao loi tinh cong no neu hop dong khong ton tai', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue(null);
        await expect(getContractBalance(999)).rejects.toThrow('Không tìm thấy hợp đồng');
    });

    test('UT18 - Tu choi so tien thanh toan bang 0, am hoac khong phai so', async () => {
        for (const soTien of [0, -5, NaN, '100', undefined]) {
            await expect(addPayment(1, soTien, 'TIEN_MAT')).rejects.toThrow('Số tiền phải lớn hơn 0');
        }
        expect(tx.thanh_toan.create).not.toHaveBeenCalled();
    });

    test('UT19 - Tu choi thanh toan vuot qua so tien con no', async () => {
        await expect(addPayment(1, 2000001, 'TIEN_MAT')).rejects.toThrow('Số tiền vượt quá số còn nợ');
        expect(tx.thanh_toan.create).not.toHaveBeenCalled();
    });

    test('UT20 - Ghi nhan thanh toan hop le', async () => {
        await addPayment(1, 2000000, 'CHUYEN_KHOAN');
        expect(tx.thanh_toan.create).toHaveBeenCalledWith({
            data: { maHD: 1, soTien: 2000000, phuongThuc: 'CHUYEN_KHOAN', ngayTT: expect.any(Date) },
        });
    });

    test('UT39 - Khong nhan thanh toan cho hop dong da huy', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({ maHD: 1, tienThue: 3000000, trangThai: 'DA_HUY' });
        await expect(addPayment(1, 100000, 'TIEN_MAT')).rejects.toThrow('Hợp đồng đã hủy');
        expect(tx.thanh_toan.create).not.toHaveBeenCalled();
    });

    test('UT40 - Phuong thuc thanh toan khong hop le', async () => {
        await expect(addPayment(1, 100000, 'BITCOIN')).rejects.toThrow('Phương thức thanh toán không hợp lệ');
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test('UT41 - Khoa dong hop dong truoc khi tinh cong no (chong tra vuot khi dong thoi)', async () => {
        await addPayment(1, 100000, 'THE');
        expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
            tx.thanh_toan.aggregate.mock.invocationCallOrder[0]
        );
    });
});

// =====================================================
// 7. BAO TRI
// =====================================================
describe('Unit Test - Bao tri xe (startMaintenance & completeMaintenance)', () => {
    test('UT21 - Tu choi bao tri neu xe dang duoc thue', async () => {
        tx.xe.findUnique.mockResolvedValue({ maXe: 1, trangThai: 'DANG_THUE' });
        await expect(startMaintenance(1, 'Thay nhot')).rejects.toThrow('Xe đang được thuê, không thể bảo trì lúc này');
        expect(tx.bao_tri.create).not.toHaveBeenCalled();
    });

    test('UT22 - Bat dau bao tri thanh cong chuyen xe sang DANG_BAO_TRI', async () => {
        tx.bao_tri.create.mockResolvedValue({ maBT: 5, trangThai: 'DANG_BAO_TRI' });
        const ketQua = await startMaintenance(1, 'Thay nhot', 300000);
        expect(tx.xe.update).toHaveBeenCalledWith({ where: { maXe: 1 }, data: { trangThai: 'DANG_BAO_TRI' } });
        expect(tx.bao_tri.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ maXe: 1, noiDung: 'Thay nhot', chiPhi: 300000, trangThai: 'DANG_BAO_TRI' }),
        });
        expect(ketQua.trangThai).toBe('DANG_BAO_TRI');
    });

    test('UT42 - Khong tao them phieu khi xe da dang bao tri', async () => {
        tx.xe.findUnique.mockResolvedValue({ maXe: 1, trangThai: 'DANG_BAO_TRI' });
        await expect(startMaintenance(1, 'x')).rejects.toThrow('Xe đang trong quá trình bảo trì');
        expect(tx.bao_tri.create).not.toHaveBeenCalled();
    });

    test('UT43 - Khong bao tri khi xe co hop dong sap toi', async () => {
        tx.hop_dong.findFirst.mockResolvedValue({ maHD: 8 });
        await expect(startMaintenance(1, 'x')).rejects.toThrow('Xe đã có hợp đồng sắp tới');
        expect(tx.xe.update).not.toHaveBeenCalled();
    });

    test('UT44 - Khong bao tri xe da ngung hoat dong / chi phi am', async () => {
        tx.xe.findUnique.mockResolvedValue({ maXe: 1, trangThai: 'NGUNG_HOAT_DONG' });
        await expect(startMaintenance(1, 'x')).rejects.toThrow('Xe đã ngừng hoạt động');
        await expect(startMaintenance(1, 'x', -1)).rejects.toThrow('Chi phí bảo trì không hợp lệ');
    });

    test('UT82 - Tu choi chi phi hoan tat bao tri am hoac khong huu han', async () => {
        for (const chiPhi of [-1, NaN, Infinity]) {
            await expect(completeMaintenance(1, chiPhi)).rejects.toThrow('Chi phí bảo trì không hợp lệ');
        }
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test('UT23 - Tu choi hoan thanh phieu bao tri da xong truoc do', async () => {
        tx.bao_tri.findUnique.mockResolvedValue({ maBT: 1, maXe: 1, trangThai: 'DA_HOAN_THANH' });
        await expect(completeMaintenance(1)).rejects.toThrow('Phiếu này đã hoàn thành');
        expect(tx.xe.update).not.toHaveBeenCalled();
    });

    test('UT24 - Hoan thanh bao tri thanh cong chuyen xe ve SAN_SANG', async () => {
        tx.bao_tri.findUnique
            .mockResolvedValueOnce({ maBT: 1, maXe: 1, trangThai: 'DANG_BAO_TRI' })
            .mockResolvedValueOnce({ maBT: 1, maXe: 1, trangThai: 'DA_HOAN_THANH' });
        tx.xe.findUnique.mockResolvedValue({ maXe: 1, trangThai: 'DANG_BAO_TRI' });
        const ketQua = await completeMaintenance(1, 450000);
        expect(tx.bao_tri.updateMany).toHaveBeenCalledWith({
            where: { maBT: 1, trangThai: { not: 'DA_HOAN_THANH' } },
            data: expect.objectContaining({ trangThai: 'DA_HOAN_THANH', chiPhi: 450000 }),
        });
        expect(tx.xe.update).toHaveBeenCalledWith({ where: { maXe: 1 }, data: { trangThai: 'SAN_SANG' } });
        expect(ketQua.trangThai).toBe('DA_HOAN_THANH');
    });

    test('UT83 - Bao loi neu khong tim thay phieu bao tri', async () => {
        tx.bao_tri.findUnique.mockResolvedValue(null);
        await expect(completeMaintenance(999)).rejects.toThrow('Không tìm thấy phiếu bảo trì');
        expect(tx.bao_tri.updateMany).not.toHaveBeenCalled();
    });

    test('UT84 - Khong cap nhat xe neu phieu bao tri vua bi hoan thanh', async () => {
        tx.bao_tri.findUnique.mockResolvedValue({ maBT: 1, maXe: 1, trangThai: 'DANG_BAO_TRI' });
        tx.bao_tri.updateMany.mockResolvedValue({ count: 0 });
        await expect(completeMaintenance(1)).rejects.toThrow('Phiếu này đã hoàn thành');
        expect(tx.bao_tri.count).not.toHaveBeenCalled();
        expect(tx.xe.update).not.toHaveBeenCalled();
    });

    test('UT45 - Con phieu bao tri khac dang mo thi chua tra xe ve SAN_SANG', async () => {
        tx.bao_tri.findUnique.mockResolvedValue({ maBT: 1, maXe: 1, trangThai: 'DANG_BAO_TRI' });
        tx.bao_tri.count.mockResolvedValue(1);
        await completeMaintenance(1);
        expect(tx.xe.update).not.toHaveBeenCalled();
    });

    test('UT46 - Xe khong o trang thai DANG_BAO_TRI (vd ngung hoat dong) thi giu nguyen', async () => {
        tx.bao_tri.findUnique.mockResolvedValue({ maBT: 1, maXe: 1, trangThai: 'DANG_BAO_TRI' });
        tx.xe.findUnique.mockResolvedValue({ maXe: 1, trangThai: 'NGUNG_HOAT_DONG' });
        await completeMaintenance(1);
        expect(tx.xe.update).not.toHaveBeenCalled();
    });
});

// =====================================================
// 8. TIM KIEM VA THONG KE
// =====================================================
describe('Unit Test - Tim kiem va Thong ke', () => {
    test('UT25 - Tim xe kha dung loai bo cac xe da co lich ban', async () => {
        prisma.hop_dong.findMany.mockResolvedValue([{ maXe: 2 }, { maXe: 3 }]);
        prisma.xe.findMany.mockResolvedValue([{ maXe: 1 }]);
        const ketQua = await findAvailableVehicles('2026-11-10', '2026-11-12');
        expect(prisma.xe.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { trangThai: { in: ['SAN_SANG', 'DANG_THUE'] }, maXe: { notIn: [2, 3] } },
            })
        );
        expect(ketQua).toHaveLength(1);
    });

    test('UT47 - Loc xe kha dung theo loai xe', async () => {
        prisma.hop_dong.findMany.mockResolvedValue([]);
        prisma.xe.findMany.mockResolvedValue([]);
        await findAvailableVehicles('2026-11-10', '2026-11-12', 4);
        expect(prisma.xe.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ maLoaiXe: 4 }) })
        );
    });

    test('UT48 - Tim xe voi khoang ngay khong hop le', async () => {
        await expect(findAvailableVehicles('2026-11-12', '2026-11-10')).rejects.toThrow('Ngày trả phải sau ngày thuê');
        await expect(findAvailableVehicles('abc', '2026-11-10')).rejects.toThrow('Ngày thuê không hợp lệ');
    });

    test('UT26 - Thong ke so luong xe theo tung trang thai', async () => {
        prisma.xe.groupBy.mockResolvedValue([
            { trangThai: 'SAN_SANG', _count: { _all: 5 } },
            { trangThai: 'DANG_THUE', _count: { _all: 2 } },
        ]);
        expect(await countVehiclesByStatus()).toEqual([
            { trangThai: 'SAN_SANG', soLuong: 5 },
            { trangThai: 'DANG_THUE', soLuong: 2 },
        ]);
    });

    test('UT27 - Thong ke doanh thu theo 12 thang trong nam', async () => {
        prisma.thanh_toan.findMany.mockResolvedValue([
            { soTien: 1000000, ngayTT: new Date(2026, 8, 5) },
            { soTien: 500000, ngayTT: new Date(2026, 8, 20) },
            { soTien: 700000, ngayTT: new Date(2026, 10, 15) },
        ]);
        prisma.hoan_tien.findMany.mockResolvedValue([{ soTien: 200000, ngayHT: new Date(2026, 10, 20) }]);
        const ketQua = await getMonthlyRevenue(2026);
        expect(ketQua).toHaveLength(12);
        expect(ketQua[8]).toEqual({ thang: 9, doanhThu: 1500000 });
        expect(ketQua[10]).toEqual({ thang: 11, doanhThu: 500000 }); // 700000 thu - 200000 hoan
        expect(ketQua[0].doanhThu).toBe(0);
    });

    test('UT49 - Thong ke chi phi bao tri theo xe', async () => {
        prisma.bao_tri.groupBy.mockResolvedValue([
            { maXe: 1, _count: { _all: 2 }, _sum: { chiPhi: 900000 } },
            { maXe: 2, _count: { _all: 1 }, _sum: { chiPhi: null } },
        ]);
        expect(await getMaintenanceCostByVehicle()).toEqual([
            { maXe: 1, soLanBaoTri: 2, tongChiPhi: 900000 },
            { maXe: 2, soLanBaoTri: 1, tongChiPhi: 0 },
        ]);
    });

    test('UT50 - Xe duoc thue nhieu nhat (bo qua hop dong da huy)', async () => {
        prisma.hop_dong.groupBy.mockResolvedValue([{ maXe: 3, _count: { _all: 4 } }]);
        expect(await getMostRentedVehicles(3)).toEqual([{ maXe: 3, soLanThue: 4 }]);
        expect(prisma.hop_dong.groupBy).toHaveBeenCalledWith(
            expect.objectContaining({ where: { trangThai: { not: 'DA_HUY' } }, take: 3 })
        );
    });

    test('UT90 - getMostRentedVehicles mac dinh gioi han 5 xe', async () => {
        prisma.hop_dong.groupBy.mockResolvedValue([]);
        expect(await getMostRentedVehicles()).toEqual([]);
        expect(prisma.hop_dong.groupBy).toHaveBeenCalledWith(
            expect.objectContaining({ take: 5 })
        );
    });

    test('UT51 - Hop dong qua han: dang thue va da qua ngay tra', async () => {
        prisma.hop_dong.findMany.mockResolvedValue([{ maHD: 7 }]);
        expect(await getOverdueContracts()).toEqual([{ maHD: 7 }]);
        expect(prisma.hop_dong.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { trangThai: 'DANG_THUE', ngayTra: { lt: expect.any(Date) } } })
        );
    });
});

// =====================================================
// 9. THOI GIAN DEM 4 GIO GIUA HAI HOP DONG
// =====================================================
describe('Unit Test - Thoi gian dem 4 gio', () => {
    const H4 = 4 * 3600 * 1000;

    test('UT64 - createContract kiem tra trung lich voi dem 4h hai dau', async () => {
        await createContract(newContract({ ngayThue: '2026-11-21T08:00:00Z', ngayTra: '2026-11-23T08:00:00Z' }));
        const where = tx.hop_dong.findFirst.mock.calls[0][0].where;
        expect(where.ngayThue.lt).toEqual(new Date('2026-11-23T12:00:00Z'));
        expect(where.ngayTra.gt).toEqual(new Date('2026-11-21T04:00:00Z'));
    });

    test('UT65 - findAvailableVehicles cung ap dung dem 4h', async () => {
        prisma.hop_dong.findMany.mockResolvedValue([]);
        prisma.xe.findMany.mockResolvedValue([]);
        await findAvailableVehicles('2026-11-21T08:00:00Z', '2026-11-23T08:00:00Z');
        const where = prisma.hop_dong.findMany.mock.calls[0][0].where;
        expect(where.ngayThue.lt).toEqual(new Date('2026-11-23T12:00:00Z'));
        expect(where.ngayTra.gt).toEqual(new Date('2026-11-21T04:00:00Z'));
    });

    test('UT66 - getAtRiskContracts: khong co hop dong dang thue -> rong', async () => {
        prisma.hop_dong.findMany.mockResolvedValue([]);
        expect(await getAtRiskContracts()).toEqual([]);
        expect(prisma.hop_dong.findMany).toHaveBeenCalledTimes(1);
    });

    test('UT67 - getAtRiskContracts: xe da qua han tra va co hop dong sap toi -> canh bao qua han', async () => {
        const current = { maHD: 7, maXe: 3, trangThai: 'DANG_THUE', ngayTra: new Date(Date.now() - 3.5 * 3600 * 1000) };
        const next = { maHD: 20, maXe: 3, trangThai: 'DA_XAC_NHAN', ngayThue: new Date(Date.now() + 2 * 3600 * 1000) };
        prisma.hop_dong.findMany.mockImplementation(async ({ where }) =>
            where.trangThai === 'DANG_THUE' ? [current] : [next]
        );
        const ketQua = await getAtRiskContracts();
        expect(ketQua).toHaveLength(1);
        expect(ketQua[0].quaHan).toBe(true);
        expect(ketQua[0].soGioTre).toBe(4);
        expect(ketQua[0].hopDongSapToi.maHD).toBe(20);
        // xe du kien san sang = bay gio + 4h dem
        const upcomingWhere = prisma.hop_dong.findMany.mock.calls[1][0].where;
        expect(upcomingWhere.maXe).toBe(3);
        expect(upcomingWhere.ngayThue.lt.getTime() - Date.now()).toBeLessThan(H4 + 5000);
    });

    test('UT68 - getAtRiskContracts: chua qua han nhung sat gio (trong dem) van canh bao, soGioTre = 0', async () => {
        const current = { maHD: 7, maXe: 3, trangThai: 'DANG_THUE', ngayTra: new Date(Date.now() + 3600 * 1000) };
        const next = { maHD: 21, maXe: 3, trangThai: 'CHO_XAC_NHAN', ngayThue: new Date(Date.now() + 3 * 3600 * 1000) };
        prisma.hop_dong.findMany.mockImplementation(async ({ where }) =>
            where.trangThai === 'DANG_THUE' ? [current] : [next]
        );
        const [canhBao] = await getAtRiskContracts();
        expect(canhBao.quaHan).toBe(false);
        expect(canhBao.soGioTre).toBe(0);
    });

    test('UT69 - getAtRiskContracts: khong co hop dong sap toi nao bi anh huong -> rong', async () => {
        prisma.hop_dong.findMany.mockImplementation(async ({ where }) =>
            where.trangThai === 'DANG_THUE'
                ? [{ maHD: 7, maXe: 3, ngayTra: new Date(Date.now() + 86400000) }]
                : []
        );
        expect(await getAtRiskContracts()).toEqual([]);
    });
});

// =====================================================
// 10. DOI XE (reassignVehicle)
// =====================================================
describe('Unit Test - Doi xe cho hop dong (reassignVehicle)', () => {
    const vehicles = {
        1: { maXe: 1, maLoaiXe: 1, trangThai: 'DANG_THUE', soCho: 4, loai_xe: { giaThueNgay: 500000 } },
        2: { maXe: 2, maLoaiXe: 1, trangThai: 'SAN_SANG', soCho: 4, loai_xe: { giaThueNgay: 500000 } },
    };

    beforeEach(() => {
        tx.hop_dong.findUnique.mockResolvedValue({
            maHD: 1, maXe: 1, trangThai: 'DA_XAC_NHAN',
            ngayThue: new Date('2026-11-21T08:00:00Z'), ngayTra: new Date('2026-11-23T08:00:00Z'),
        });
        tx.xe.findUnique.mockImplementation(async ({ where }) => vehicles[where.maXe] ?? null);
    });

    test('UT70 - Doi xe thanh cong, giu nguyen tien thue', async () => {
        const ketQua = await reassignVehicle(1, 2);
        expect(tx.hop_dong.updateMany).toHaveBeenCalledWith({
            where: { maHD: 1, trangThai: { in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN'] } },
            data: { maXe: 2 },
        });
        expect(ketQua.maHD).toBe(1);
    });

    test('UT71 - Chi doi duoc khi chua giao xe', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({ maHD: 1, maXe: 1, trangThai: 'DANG_THUE' });
        await expect(reassignVehicle(1, 2)).rejects.toThrow('Chỉ đổi xe được cho hợp đồng chưa giao xe');
        expect(tx.hop_dong.updateMany).not.toHaveBeenCalled();
    });

    test('UT72 - Xe moi trung xe hien tai / khong ton tai', async () => {
        await expect(reassignVehicle(1, 1)).rejects.toThrow('Xe mới trùng với xe hiện tại');
        await expect(reassignVehicle(1, 99)).rejects.toThrow('Không tìm thấy xe');
    });

    test('UT73 - Xe moi dang bao tri hoac ngung hoat dong', async () => {
        vehicles[2] = { ...vehicles[2], trangThai: 'DANG_BAO_TRI' };
        await expect(reassignVehicle(1, 2)).rejects.toThrow('Xe mới đang bảo trì hoặc ngừng hoạt động');
        vehicles[2] = { ...vehicles[2], trangThai: 'NGUNG_HOAT_DONG' };
        await expect(reassignVehicle(1, 2)).rejects.toThrow('Xe mới đang bảo trì hoặc ngừng hoạt động');
        vehicles[2] = { ...vehicles[2], trangThai: 'SAN_SANG' };
    });

    test('UT74 - Xe moi it cho ngoi hon xe cu', async () => {
        vehicles[1] = { ...vehicles[1], soCho: 7 };
        await expect(reassignVehicle(1, 2)).rejects.toThrow('Xe mới có ít chỗ ngồi hơn xe cũ');
        vehicles[1] = { ...vehicles[1], soCho: 4 };
    });

    test('UT75 - Xe moi hang dat hon: can nangCapMienPhi moi duoc doi', async () => {
        vehicles[2] = { ...vehicles[2], loai_xe: { giaThueNgay: 900000 } };
        await expect(reassignVehicle(1, 2)).rejects.toThrow('nangCapMienPhi');
        await reassignVehicle(1, 2, { nangCapMienPhi: true });
        expect(tx.hop_dong.updateMany).toHaveBeenCalledTimes(1);
        vehicles[2] = { ...vehicles[2], loai_xe: { giaThueNgay: 500000 } };
    });

    test('UT76 - Xe moi trung lich (ke ca dem 4h) bi tu choi', async () => {
        tx.hop_dong.findFirst.mockResolvedValue({ maHD: 55, maXe: 2 });
        await expect(reassignVehicle(1, 2)).rejects.toThrow('Xe mới đã có hợp đồng khác');
        expect(tx.hop_dong.updateMany).not.toHaveBeenCalled();
    });

    test('UT77 - Hop dong bi doi trang thai giua chung thi khong doi xe', async () => {
        tx.hop_dong.updateMany.mockResolvedValue({ count: 0 });
        await expect(reassignVehicle(1, 2)).rejects.toThrow('Hợp đồng vừa bị thay đổi');
    });

    test('UT78 - Khoa ca hai xe theo thu tu ma xe tang dan (tranh deadlock)', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({
            maHD: 1, maXe: 2, trangThai: 'DA_XAC_NHAN',
            ngayThue: new Date('2026-11-21T08:00:00Z'), ngayTra: new Date('2026-11-23T08:00:00Z'),
        });
        tx.xe.findUnique
            .mockResolvedValueOnce({ ...vehicles[2], trangThai: 'DANG_THUE' })
            .mockResolvedValueOnce({ ...vehicles[1], trangThai: 'SAN_SANG' });

        await reassignVehicle(1, 1);
        expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
        expect(tx.$queryRaw.mock.calls.map((call) => call[1])).toEqual([1, 2]);
    });

    test('UT91 - Doi xe van xu ly khi thieu du lieu gia thue', async () => {
        tx.xe.findUnique.mockImplementation(async ({ where }) => ({
            ...vehicles[where.maXe],
            loai_xe: undefined,
        }));
        await reassignVehicle(1, 2);
        expect(tx.hop_dong.updateMany).toHaveBeenCalledWith({
            where: { maHD: 1, trangThai: { in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN'] } },
            data: { maXe: 2 },
        });
    });
});

// =====================================================
// 11. HUY DO LOI CONG TY
// =====================================================
describe('Unit Test - Huy do loi cong ty (cancelContract loiCongTy)', () => {
    test('UT79 - Huy muon do loi cong ty van hoan 100%', async () => {
        tx.hop_dong.findUnique.mockResolvedValue({
            maHD: 1, trangThai: 'DA_XAC_NHAN', ngayThue: new Date(Date.now() + 2 * 3600 * 1000), tienThue: 1000000,
        });
        tx.thanh_toan.aggregate.mockResolvedValue({ _sum: { soTien: 600000 } });
        tx.hoan_tien.create.mockImplementation(async ({ data }) => ({ maHT: 1, ...data }));

        const macDinh = await cancelContract(1);
        expect(macDinh.hoanTien.soTien).toBe(420000); // huy muon binh thuong: 70%

        const loiCongTy = await cancelContract(1, { loiCongTy: true });
        expect(loiCongTy.hoanTien.soTien).toBe(600000);
        expect(loiCongTy.hoanTien.lyDo).toContain('lỗi phía công ty');
    });
});
