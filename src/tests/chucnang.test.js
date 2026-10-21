import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Gia lap Prisma, khong ket noi MySQL that
const prisma = {
    $transaction: jest.fn(),
    hop_dong: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    xe: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
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

// Phai mock Prisma truoc khi import file nghiep vu
jest.unstable_mockModule('../prismaClient.js', () => ({
    prisma,
}));

const {
    taoHopDong,
    congNoHopDong,
    themThanhToan
} = await import('../chucnang.js');

// Cac ham Prisma nam trong transaction
const tx = {
    xe: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    hop_dong: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    bao_tri: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    tinh_trang_tra_xe: {
        create: jest.fn(),
    },
};

describe('Unit Test - Tao hop dong thue xe', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        // Gia lap transaction chay callback voi tx
        prisma.$transaction.mockImplementation(
            async (callback) => callback(tx)
        );

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
            taoHopDong({
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
            taoHopDong({
                maKH: 1,
                maXe: 99,
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
            taoHopDong({
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
            taoHopDong({
                maKH: 1,
                maXe: 1,
                maNV: 1,
                ngayThue: '2026-11-10',
                ngayTra: '2026-11-12',
                tienThue: 600000,
            })
        ).rejects.toThrow(
            'Xe đã có hợp đồng khác trong khoảng thời gian này'
        );

        expect(tx.hop_dong.create).not.toHaveBeenCalled();
    });

    test('UT05 - Tao hop dong thanh cong', async () => {
        const ketQua = await taoHopDong({
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

describe('Unit Test - Cong no va thanh toan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
// UT08 - Tinh cong no hop dong
    test('UT08 - Tinh dung so tien con no', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({
            maHD: 100,
            tienThue: 900000,
        });

        prisma.thanh_toan.aggregate.mockResolvedValue({
            _sum: { soTien: 300000 },
        });

        const ketQua = await congNoHopDong(100);

        expect(ketQua).toEqual({
            maHD: 100,
            tienThue: 900000,
            daThanhToan: 300000,
            conNo: 600000,
        });
    });

    // UT09 - Khong tim thay hop dong
    test('UT09 - Bao loi neu hop dong khong ton tai', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue(null);

        await expect(
            congNoHopDong(999)
        ).rejects.toThrow('Không tìm thấy hợp đồng');

        expect(prisma.thanh_toan.aggregate).not.toHaveBeenCalled();
    });

    // UT10 - Khong chap nhan thanh toan bang 0
    test('UT10 - Tu choi so tien thanh toan bang 0', async () => {
        await expect(
            themThanhToan(100, 0, 'TIEN_MAT')
        ).rejects.toThrow('Số tiền phải lớn hơn 0');

        expect(prisma.thanh_toan.create).not.toHaveBeenCalled();
    });

    // UT11 - Khong cho thanh toan vuot cong no
    test('UT11 - Tu choi thanh toan vuot so tien con no', async () => {
        prisma.hop_dong.findUnique.mockResolvedValue({
            maHD: 100,
            tienThue: 900000,
        });

        prisma.thanh_toan.aggregate.mockResolvedValue({
            _sum: { soTien: 300000 },
        });

        await expect(
            themThanhToan(100, 700000, 'TIEN_MAT')
        ).rejects.toThrow(
            'Số tiền vượt quá số còn nợ (600000)'
        );

        expect(prisma.thanh_toan.create).not.toHaveBeenCalled();
    });

    // UT12 - Thanh toan hop le
    test('UT12 - Ghi nhan thanh toan hop le', async () => {
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

        const ketQua = await themThanhToan(
            100,
            200000,
            'TIEN_MAT'
        );

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
